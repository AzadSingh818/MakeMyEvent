// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection'; // ✅ Fixed: Using PostgreSQL instead of Prisma
import { z } from 'zod';

const UpdateEventSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  location: z.string().min(1).optional(),
  venue: z.string().optional(),
  maxParticipants: z.number().positive().optional(),
  registrationDeadline: z.string().transform((str) => new Date(str)).optional(),
  eventType: z.enum(['CONFERENCE', 'WORKSHOP', 'SEMINAR', 'SYMPOSIUM']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  tags: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
});

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // Check if user has access to this event
    const userEventQuery = `
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2
    `;
    const userEventResult = await query(userEventQuery, [session.user.id, eventId]);

    // If not directly associated, check if it's a published event
    if (userEventResult.rows.length === 0) {
      const eventStatusQuery = `SELECT status FROM events WHERE id = $1`;
      const eventStatusResult = await query(eventStatusQuery, [eventId]);

      if (eventStatusResult.rows.length === 0 || eventStatusResult.rows[0].status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: 'Event not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Get comprehensive event data
    const eventQuery = `
      SELECT 
        e.*,
        u.name as creator_name,
        u.email as creator_email,
        u.phone as creator_phone,
        (SELECT COUNT(*) FROM conference_sessions s WHERE s.event_id = e.id) as sessions_count,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'APPROVED') as registrations_count,
        (SELECT COUNT(*) FROM user_events ue WHERE ue.event_id = e.id) as user_events_count,
        (SELECT COUNT(*) FROM abstracts a WHERE a.event_id = e.id) as abstracts_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `;

    const eventResult = await query(eventQuery, [eventId]);

    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventRow = eventResult.rows[0];

    // Get sessions with details
    const sessionsQuery = `
      SELECT 
        cs.*,
        h.name as hall_name,
        h.capacity as hall_capacity
      FROM conference_sessions cs
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE cs.event_id = $1
      ORDER BY cs.start_time ASC
    `;
    const sessionsResult = await query(sessionsQuery, [eventId]);

    // Get registrations
    const registrationsQuery = `
      SELECT 
        r.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM registrations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1 AND r.status = 'APPROVED'
      ORDER BY r.created_at DESC
    `;
    const registrationsResult = await query(registrationsQuery, [eventId]);

    // Get user events (team members)
    const userEventsQuery = `
      SELECT 
        ue.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM user_events ue
      LEFT JOIN users u ON ue.user_id = u.id
      WHERE ue.event_id = $1
      ORDER BY ue.created_at DESC
    `;
    const userEventsResult = await query(userEventsQuery, [eventId]);

    // Get halls
    const hallsQuery = `
      SELECT id, name, capacity, equipment
      FROM halls
      WHERE event_id = $1
      ORDER BY name
    `;
    const hallsResult = await query(hallsQuery, [eventId]);

    // Format response data
    const responseData = {
      id: eventRow.id,
      name: eventRow.name,
      description: eventRow.description,
      startDate: eventRow.start_date,
      endDate: eventRow.end_date,
      location: eventRow.location,
      venue: eventRow.venue,
      maxParticipants: eventRow.max_participants,
      registrationDeadline: eventRow.registration_deadline,
      eventType: eventRow.event_type,
      status: eventRow.status,
      tags: eventRow.tags ? JSON.parse(eventRow.tags) : [],
      website: eventRow.website,
      contactEmail: eventRow.contact_email,
      createdAt: eventRow.created_at,
      updatedAt: eventRow.updated_at,
      createdByUser: {
        id: eventRow.created_by,
        name: eventRow.creator_name,
        email: eventRow.creator_email,
        phone: eventRow.creator_phone
      },
      sessions: sessionsResult.rows.map(session => ({
        id: session.id,
        title: session.title,
        description: session.description,
        startTime: session.start_time,
        endTime: session.end_time,
        hall: session.hall_id ? {
          id: session.hall_id,
          name: session.hall_name,
          capacity: session.hall_capacity
        } : null
      })),
      registrations: registrationsResult.rows.map(reg => ({
        id: reg.id,
        status: reg.status,
        createdAt: reg.created_at,
        user: {
          id: reg.user_id,
          name: reg.user_name,
          email: reg.user_email,
          role: reg.user_role
        }
      })),
      userEvents: userEventsResult.rows.map(ue => ({
        id: ue.id,
        role: ue.role,
        permissions: ue.permissions ? JSON.parse(ue.permissions) : [],
        user: {
          id: ue.user_id,
          name: ue.user_name,
          email: ue.user_email,
          role: ue.user_role
        }
      })),
      halls: hallsResult.rows.map(hall => ({
        id: hall.id,
        name: hall.name,
        capacity: hall.capacity,
        equipment: hall.equipment ? JSON.parse(hall.equipment) : []
      })),
      _count: {
        sessions: parseInt(eventRow.sessions_count || '0'),
        registrations: parseInt(eventRow.registrations_count || '0'),
        userEvents: parseInt(eventRow.user_events_count || '0'),
        abstracts: parseInt(eventRow.abstracts_count || '0')
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Event GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update single event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // Check permissions
    const permissionQuery = `
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2
    `;
    const permissionResult = await query(permissionQuery, [session.user.id, eventId]);

    if (permissionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this event' },
        { status: 403 }
      );
    }

    const permissions = JSON.parse(permissionResult.rows[0].permissions || '[]');
    if (!permissions.includes('WRITE')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this event' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateEventSchema.parse(body);

    // Validate dates if both are provided
    if (validatedData.startDate && validatedData.endDate) {
      if (validatedData.startDate >= validatedData.endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramCount = 0;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramCount}`);
        updateParams.push(key === 'tags' ? JSON.stringify(value) : value);
      }
    });

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateParams.push(new Date());

    // Add WHERE clause parameter
    paramCount++;
    updateParams.push(eventId);

    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await query(updateQuery, updateParams);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get creator details for response
    const userResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [session.user.id]
    );

    const updatedEvent = updateResult.rows[0];
    const responseData = {
      id: updatedEvent.id,
      name: updatedEvent.name,
      description: updatedEvent.description,
      startDate: updatedEvent.start_date,
      endDate: updatedEvent.end_date,
      location: updatedEvent.location,
      venue: updatedEvent.venue,
      maxParticipants: updatedEvent.max_participants,
      registrationDeadline: updatedEvent.registration_deadline,
      eventType: updatedEvent.event_type,
      status: updatedEvent.status,
      tags: updatedEvent.tags ? JSON.parse(updatedEvent.tags) : [],
      website: updatedEvent.website,
      contactEmail: updatedEvent.contact_email,
      createdAt: updatedEvent.created_at,
      updatedAt: updatedEvent.updated_at,
      createdByUser: {
        id: session.user.id,
        name: userResult.rows[0]?.name,
        email: userResult.rows[0]?.email
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Event PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete single event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // Check permissions
    const permissionQuery = `
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2
    `;
    const permissionResult = await query(permissionQuery, [session.user.id, eventId]);

    if (permissionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this event' },
        { status: 403 }
      );
    }

    const permissions = JSON.parse(permissionResult.rows[0].permissions || '[]');
    if (!permissions.includes('DELETE')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this event' },
        { status: 403 }
      );
    }

    // Check if event has active sessions
    const activeSessionsQuery = `
      SELECT COUNT(*) as count FROM conference_sessions 
      WHERE event_id = $1 AND start_time > NOW()
    `;
    const activeSessionsResult = await query(activeSessionsQuery, [eventId]);

    if (parseInt(activeSessionsResult.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with upcoming sessions' },
        { status: 400 }
      );
    }

    // Soft delete - update status instead of actual deletion
    const deleteQuery = `
      UPDATE events 
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, status
    `;

    const deleteResult = await query(deleteQuery, [eventId]);

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleteResult.rows[0],
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Event DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id] - Partial update (for status changes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const body = await request.json();
    const { action, ...data } = body;

    // Check permissions
    const permissionQuery = `
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2
    `;
    const permissionResult = await query(permissionQuery, [session.user.id, eventId]);

    if (permissionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const permissions = JSON.parse(permissionResult.rows[0].permissions || '[]');
    if (!permissions.includes('WRITE')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let updateData: any = {};
    let message = 'Event updated successfully';

    switch (action) {
      case 'PUBLISH':
        updateData.status = 'PUBLISHED';
        message = 'Event published successfully';
        break;
      case 'UNPUBLISH':
        updateData.status = 'DRAFT';
        message = 'Event unpublished successfully';
        break;
      case 'START':
        updateData.status = 'ONGOING';
        message = 'Event started successfully';
        break;
      case 'COMPLETE':
        updateData.status = 'COMPLETED';
        message = 'Event completed successfully';
        break;
      case 'CANCEL':
        updateData.status = 'CANCELLED';
        message = 'Event cancelled successfully';
        break;
      default:
        // Regular partial update
        const validatedData = UpdateEventSchema.parse(data);
        updateData = validatedData;
    }

    // Build update query
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramCount = 0;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramCount}`);
        updateParams.push(value);
      }
    });

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateParams.push(new Date());

    // Add WHERE clause parameter
    paramCount++;
    updateParams.push(eventId);

    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, status, start_date, end_date, updated_at
    `;

    const updateResult = await query(updateQuery, updateParams);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const updatedEvent = updateResult.rows[0];
    const responseData = {
      id: updatedEvent.id,
      name: updatedEvent.name,
      status: updatedEvent.status,
      startDate: updatedEvent.start_date,
      endDate: updatedEvent.end_date,
      updatedAt: updatedEvent.updated_at
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message
    });

  } catch (error) {
    console.error('Event PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}