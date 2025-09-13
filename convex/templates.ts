import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Template listing query with improved pagination and indexing
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    
    // Apply search filter if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      
      // Use indexed search for better performance
      const allTemplates = await ctx.db
        .query("templates")
        .withIndex("by_creation")
        .order("desc")
        .collect();
      
      const filteredTemplates = allTemplates.filter((template) => 
        template.name.toLowerCase().includes(searchLower) ||
        (template.description && template.description.toLowerCase().includes(searchLower))
      );
      
      // Handle pagination for search results
      if (args.cursor) {
        const cursorData = JSON.parse(args.cursor);
        const { lastCreatedAt, lastId } = cursorData;
        
        const paginatedResults = filteredTemplates.filter(template => 
          template.createdAt < lastCreatedAt || 
          (template.createdAt === lastCreatedAt && template._id < lastId)
        );
        
        const pageResults = paginatedResults.slice(0, limit);
        const hasMore = paginatedResults.length > limit;
        
        // Map templates to include calculated fields
        const templatesWithCounts = pageResults.map(template => ({
          ...template,
          semesterCount: template.semesters.length,
          totalCourses: template.semesters.reduce((sum, semester) => sum + semester.courses.length, 0),
        }));
        
        return {
          templates: templatesWithCounts,
          hasMore,
          nextCursor: hasMore ? JSON.stringify({
            lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
            lastId: pageResults[pageResults.length - 1]._id
          }) : undefined,
        };
      }
      
      // First page of search results
      const pageResults = filteredTemplates.slice(0, limit);
      const hasMore = filteredTemplates.length > limit;
      
      // Map templates to include calculated fields
      const templatesWithCounts = pageResults.map(template => ({
        ...template,
        semesterCount: template.semesters.length,
        totalCourses: template.semesters.reduce((sum, semester) => sum + semester.courses.length, 0),
      }));
      
      return {
        templates: templatesWithCounts,
        hasMore,
        nextCursor: hasMore ? JSON.stringify({
          lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
          lastId: pageResults[pageResults.length - 1]._id
        }) : undefined,
      };
    }
    
    // Handle pagination with cursor (improved)
    if (args.cursor) {
      const cursorData = JSON.parse(args.cursor);
      const { lastCreatedAt, lastId } = cursorData;
      
      const templates = await ctx.db
        .query("templates")
        .withIndex("by_creation")
        .filter((q) => 
          q.or(
            q.lt(q.field("createdAt"), lastCreatedAt),
            q.and(
              q.eq(q.field("createdAt"), lastCreatedAt),
              q.lt(q.field("_id"), lastId)
            )
          )
        )
        .order("desc")
        .take(limit + 1);
      
      const hasMore = templates.length > limit;
      const pageResults = hasMore ? templates.slice(0, limit) : templates;
      
      // Map templates to include calculated fields
      const templatesWithCounts = pageResults.map(template => ({
        ...template,
        semesterCount: template.semesters.length,
        totalCourses: template.semesters.reduce((sum, semester) => sum + semester.courses.length, 0),
      }));
      
      return {
        templates: templatesWithCounts,
        hasMore,
        nextCursor: hasMore ? JSON.stringify({
          lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
          lastId: pageResults[pageResults.length - 1]._id
        }) : undefined,
      };
    }
    
    // Default: return first page with improved indexing
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_creation")
      .order("desc")
      .take(limit + 1);
    
    const hasMore = templates.length > limit;
    const pageResults = hasMore ? templates.slice(0, limit) : templates;
    
    // Map templates to include calculated fields
    const templatesWithCounts = pageResults.map(template => ({
      ...template,
      semesterCount: template.semesters.length,
      totalCourses: template.semesters.reduce((sum, semester) => sum + semester.courses.length, 0),
    }));
    
    return {
      templates: templatesWithCounts,
      hasMore,
      nextCursor: hasMore ? JSON.stringify({
        lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
        lastId: pageResults[pageResults.length - 1]._id
      }) : undefined,
    };
  },
});

// Get template by ID with full details (updated to use course codes)
export const getById = query({
  args: {
    id: v.id("templates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("TEMPLATE_NOT_FOUND");
    }
    
    // Populate course details in each semester using course codes
    const populatedSemesters = await Promise.all(
      template.semesters.map(async (semester) => {
        const courseDetails = await Promise.all(
          semester.courses.map(async (courseCode) => {
            const course = await ctx.db
              .query("courses")
              .withIndex("by_code", (q) => q.eq("courseCode", courseCode))
              .first();
            if (!course) {
              throw new Error(`COURSE_NOT_FOUND: ${courseCode}`);
            }
            return course;
          })
        );
        
        return {
          ...semester,
          courses: courseDetails,
        };
      })
    );
    
    return {
      ...template,
      semesters: populatedSemesters,
    };
  },
});

// Create a new template (updated to use course codes)
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    semesters: v.array(v.object({
      yearLevel: v.number(),
      semesterType: v.union(
        v.literal("first"),
        v.literal("second"),
        v.literal("summer")
      ),
      courses: v.array(v.string()), // Course codes instead of IDs
    })),
  },
  handler: async (ctx, args) => {
    // Validate template name
    if (!args.name || args.name.length < 1 || args.name.length > 100) {
      throw new Error("INVALID_TEMPLATE_NAME");
    }
    
    // Validate description if provided
    if (args.description && args.description.length > 500) {
      throw new Error("INVALID_DESCRIPTION");
    }
    
    // Check for duplicate template name
    const existingTemplate = await ctx.db
      .query("templates")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existingTemplate) {
      throw new Error("DUPLICATE_TEMPLATE_NAME");
    }
    
    // Validate template is not empty
    if (args.semesters.length === 0) {
      throw new Error("EMPTY_TEMPLATE");
    }
    
    // Validate semester structure and course references
    for (const semester of args.semesters) {
      // Validate year level
      if (semester.yearLevel < 1 || semester.yearLevel > 6) {
        throw new Error("INVALID_SEMESTER_STRUCTURE");
      }
      
      // Ensure semester has at least one course
      if (semester.courses.length === 0) {
        throw new Error("EMPTY_TEMPLATE");
      }
      
      // Validate all course references exist (by course code)
      for (const courseCode of semester.courses) {
        const course = await ctx.db
          .query("courses")
          .withIndex("by_code", (q) => q.eq("courseCode", courseCode))
          .first();
        if (!course) {
          throw new Error(`COURSE_NOT_FOUND: ${courseCode}`);
        }
      }
    }
    
    // Create the template
    const now = Date.now();
    const templateId = await ctx.db.insert("templates", {
      name: args.name,
      description: args.description,
      semesters: args.semesters,
      createdAt: now,
      updatedAt: now,
    });
    
    // Return the created template with populated course details
    const template = await ctx.db.get(templateId);
    return template;
  },
});

// Update an existing template (updated to use course codes)
export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    semesters: v.optional(v.array(v.object({
      yearLevel: v.number(),
      semesterType: v.union(
        v.literal("first"),
        v.literal("second"),
        v.literal("summer")
      ),
      courses: v.array(v.string()), // Course codes instead of IDs
    }))),
  },
  handler: async (ctx, args) => {
    // Get the existing template
    const existingTemplate = await ctx.db.get(args.id);
    if (!existingTemplate) {
      throw new Error("TEMPLATE_NOT_FOUND");
    }
    
    // Validate updates if provided
    if (args.name !== undefined) {
      if (args.name.length < 1 || args.name.length > 100) {
        throw new Error("INVALID_TEMPLATE_NAME");
      }
      
      // Check for duplicate template name (excluding current template)
      const duplicateTemplate = await ctx.db
        .query("templates")
        .withIndex("by_name", (q) => q.eq("name", args.name!))
        .first();
      
      if (duplicateTemplate && duplicateTemplate._id !== args.id) {
        throw new Error("DUPLICATE_TEMPLATE_NAME");
      }
    }
    
    if (args.description !== undefined && args.description.length > 500) {
      throw new Error("INVALID_DESCRIPTION");
    }
    
    if (args.semesters !== undefined) {
      // Validate template is not empty
      if (args.semesters.length === 0) {
        throw new Error("EMPTY_TEMPLATE");
      }
      
      // Validate semester structure and course references
      for (const semester of args.semesters) {
        // Validate year level
        if (semester.yearLevel < 1 || semester.yearLevel > 6) {
          throw new Error("INVALID_SEMESTER_STRUCTURE");
        }
        
        // Ensure semester has at least one course
        if (semester.courses.length === 0) {
          throw new Error("EMPTY_TEMPLATE");
        }
        
        // Validate all course references exist (by course code)
        for (const courseCode of semester.courses) {
          const course = await ctx.db
            .query("courses")
            .withIndex("by_code", (q) => q.eq("courseCode", courseCode))
            .first();
          if (!course) {
            throw new Error(`COURSE_NOT_FOUND: ${courseCode}`);
          }
        }
      }
    }
    
    // Update the template
    const updateData: Partial<{
      name: string;
      description: string;
      semesters: Array<{
        yearLevel: number;
        semesterType: "first" | "second" | "summer";
        courses: Array<string>; // Course codes instead of IDs
      }>;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.semesters !== undefined) updateData.semesters = args.semesters;
    
    await ctx.db.patch(args.id, updateData);
    
    // Return the updated template
    return await ctx.db.get(args.id);
  },
});

// Delete a template
export const remove = mutation({
  args: {
    id: v.id("templates"),
  },
  handler: async (ctx, args) => {
    // Get the template
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("TEMPLATE_NOT_FOUND");
    }
    
    // Delete the template
    await ctx.db.delete(args.id);
    
    return {
      deleted: true,
      id: args.id,
    };
  },
});