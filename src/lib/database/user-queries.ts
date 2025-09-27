// lib/database/user-queries.ts
import { query } from "./connection";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  institution?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log(`🔍 Getting user by ID: ${userId}`);

    const result = await query(
      `SELECT id, name, email, role, image, institution, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${userId}`);
      return null;
    }

    const row = result.rows[0];
    console.log(`✅ User found: ${row.name}`);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      image: row.image,
      institution: row.institution,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error("❌ Error getting user by ID:", error);
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log(`🔍 Getting user by email: ${email}`);

    const result = await query(
      `SELECT id, name, email, role, image, institution, created_at, updated_at 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return null;
    }

    const row = result.rows[0];
    console.log(`✅ User found: ${row.name}`);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      image: row.image,
      institution: row.institution,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error("❌ Error getting user by email:", error);
    return null;
  }
}

// Update user by ID
export async function updateUserById(
  userId: string,
  updateData: {
    name?: string;
    email?: string;
    image?: string | null;
    institution?: string | null;
  }
): Promise<User | null> {
  try {
    console.log(`📝 Updating user ${userId} with data:`, updateData);

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updateData.name);
    }

    if (updateData.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      updateValues.push(updateData.email);
    }

    if (updateData.image !== undefined) {
      updateFields.push(`image = $${paramIndex++}`);
      updateValues.push(updateData.image);
    }

    if (updateData.institution !== undefined) {
      updateFields.push(`institution = $${paramIndex++}`);
      updateValues.push(updateData.institution);
    }

    if (updateFields.length === 0) {
      console.log("⚠️ No fields to update");
      return await getUserById(userId);
    }

    // Add updated_at and user ID
    updateFields.push("updated_at = NOW()");
    updateValues.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING id, name, email, role, image, institution, created_at, updated_at
    `;

    console.log("📊 User update query:", updateQuery);
    console.log("📊 User update values:", updateValues);

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      console.error("❌ User update failed - no rows returned");
      return null;
    }

    const row = result.rows[0];
    console.log(`✅ User updated successfully: ${row.name}`);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      image: row.image,
      institution: row.institution,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return null;
  }
}

// Get all users with role FACULTY
export async function getAllFaculties(): Promise<User[]> {
  try {
    console.log("🔍 Getting all faculty users");

    const result = await query(
      `SELECT id, name, email, role, image, institution, created_at, updated_at 
       FROM users 
       WHERE role = 'FACULTY' 
       ORDER BY name ASC`
    );

    console.log(`✅ Found ${result.rows.length} faculties`);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      image: row.image,
      institution: row.institution,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error("❌ Error getting faculties:", error);
    return [];
  }
}

// Create or update user
export async function upsertUser(userData: {
  id?: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  institution?: string | null;
}): Promise<User | null> {
  try {
    console.log("📝 Upserting user:", userData.email);

    const upsertQuery = `
      INSERT INTO users (id, name, email, role, image, institution, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (email) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        image = EXCLUDED.image,
        institution = EXCLUDED.institution,
        updated_at = NOW()
      RETURNING id, name, email, role, image, institution, created_at, updated_at
    `;

    const result = await query(upsertQuery, [
      userData.id || null,
      userData.name,
      userData.email,
      userData.role,
      userData.image || null,
      userData.institution || null,
    ]);

    if (result.rows.length === 0) {
      console.error("❌ User upsert failed - no rows returned");
      return null;
    }

    const row = result.rows[0];
    console.log(`✅ User upserted: ${row.name}`);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      image: row.image,
      institution: row.institution,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error("❌ Error upserting user:", error);
    return null;
  }
}
