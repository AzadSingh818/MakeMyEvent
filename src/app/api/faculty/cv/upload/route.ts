import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

// Validation schema
const UploadSchema = z.object({
  facultyId: z.string().min(1, 'Faculty ID is required'),
});

// File validation
function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PDF, DOC, DOCX are allowed.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File too large. Max 10MB.' };
  }

  return { valid: true };
}

// Generate unique filename
function generateUniqueFilename(originalName: string, facultyId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${facultyId}_CV_${timestamp}_${randomString}.${extension}`;
}

// POST - Upload CV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const facultyId = formData.get('facultyId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate inputs
    UploadSchema.parse({ facultyId });

    // Permission check
    if (
      session.user.id !== facultyId &&
      !['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate faculty
    const facultyResult = await query(
      'SELECT id, name, email FROM users WHERE id = $1 AND role = $2',
      [facultyId, 'FACULTY']
    );
    if (facultyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Faculty member not found' }, { status: 404 });
    }
    const faculty = facultyResult.rows[0];

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    // Save file
    const uniqueFilename = generateUniqueFilename(file.name, facultyId);
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'cv');
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const dbFilePath = `/uploads/cv/${uniqueFilename}`;

    // Insert into DB
    const insertQuery = `
      INSERT INTO cv_uploads 
        (faculty_id, file_path, description, file_type, file_size, original_filename, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const insertParams = [
      facultyId,
      dbFilePath,
      null, // description initially null
      file.type,
      file.size,
      file.name,
    ];
    const result = await query(insertQuery, insertParams);
    const uploadedCV = result.rows[0];

    // Optional activity log
    try {
      await query(
        `INSERT INTO activity_logs (
          user_id, action, description, metadata, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [
          session.user.id,
          'CV_UPLOAD',
          `Uploaded CV for ${faculty.name}`,
          JSON.stringify({
            cvId: uploadedCV.id,
            facultyId,
            filename: file.name,
            fileSize: file.size,
          }),
        ]
      );
    } catch (err) {
      console.log('Activity logging skipped:', err);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'CV uploaded successfully',
        data: {
          id: uploadedCV.id,
          fileName: file.name,
          fileSize: file.size,
          filePath: dbFilePath,
          uploadedAt: uploadedCV.uploaded_at,
          faculty: {
            id: faculty.id,
            name: faculty.name,
            email: faculty.email,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('CV upload error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to upload CV. Please try again.' }, { status: 500 });
  }
}

// GET - List CV uploads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (facultyId) {
      paramCount++;
      conditions.push(`cv.faculty_id = $${paramCount}`);
      params.push(facultyId);
    }

    // Faculty can only see their own CVs
    if (session.user.role === 'FACULTY') {
      if (!facultyId || facultyId !== session.user.id) {
        paramCount++;
        conditions.push(`cv.faculty_id = $${paramCount}`);
        params.push(session.user.id);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch CV uploads
    const queryCVs = `
      SELECT 
        cv.*,
        u.name as faculty_name,
        u.email as faculty_email
      FROM cv_uploads cv
      JOIN users u ON u.id = cv.faculty_id
      ${whereClause}
      ORDER BY cv.uploaded_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(limit, offset);

    const result = await query(queryCVs, params);

    // Total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cv_uploads cv
      JOIN users u ON u.id = cv.faculty_id
      ${whereClause}
    `;
    const countResult = await query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      data: {
        cvs: result.rows.map((row) => ({
          id: row.id,
          filePath: row.file_path,
          fileType: row.file_type,
          fileSize: row.file_size,
          originalFilename: row.original_filename,
          uploadedAt: row.uploaded_at,
          faculty: {
            id: row.faculty_id,
            name: row.faculty_name,
            email: row.faculty_email,
          },
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Get CVs error:', error);
    return NextResponse.json({ error: 'Failed to fetch CVs' }, { status: 500 });
  }
}
