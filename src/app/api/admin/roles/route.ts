// src/app/api/admin/roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { z } from 'zod';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


const UpdateRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['ORGANIZER', 'EVENT_MANAGER', 'FACULTY', 'DELEGATE', 'HALL_COORDINATOR', 'SPONSOR', 'VOLUNTEER', 'VENDOR'])
});

// GET /api/admin/roles - Get all users with roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow any user to view roles (you can restrict this later)
    const users = await query(`
      SELECT id, email, name, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: users.rows
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles - Update user role
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateRoleSchema.parse(body);

    // Update user role
    const result = await query(`
      UPDATE users 
      SET role = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, email, name, role
    `, [validatedData.role, validatedData.userId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Update role error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}