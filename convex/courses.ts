import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Course listing query with pagination and search
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);
    
    // Apply search filter if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase();

      // Get all courses for case-insensitive contains search (necessary with Convex)
      const allCourses = await ctx.db.query("courses").order("desc").collect();

      // Filter courses by search query (case-insensitive contains for both code and title)
      const filteredCourses = allCourses.filter((course) =>
        course.courseCode.toLowerCase().includes(searchLower) ||
        course.title.toLowerCase().includes(searchLower)
      );
      
      // Handle pagination for search results
      if (args.cursor) {
        const cursorData = JSON.parse(args.cursor);
        const { lastCreatedAt, lastId } = cursorData;

        const paginatedResults = filteredCourses.filter(course =>
          course.createdAt < lastCreatedAt ||
          (course.createdAt === lastCreatedAt && course._id < lastId)
        );

        const pageResults = paginatedResults.slice(0, limit);
        const hasMore = paginatedResults.length > limit;

        return {
          courses: pageResults,
          hasMore,
          nextCursor: hasMore ? JSON.stringify({
            lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
            lastId: pageResults[pageResults.length - 1]._id
          }) : undefined,
        };
      }

      // First page of search results
      const pageResults = filteredCourses.slice(0, limit);
      const hasMore = filteredCourses.length > limit;

      return {
        courses: pageResults,
        hasMore,
        nextCursor: hasMore ? JSON.stringify({
          lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
          lastId: pageResults[pageResults.length - 1]._id
        }) : undefined,
      };
    }
    
    // Handle pagination without search
    if (args.cursor) {
      const cursorData = JSON.parse(args.cursor);
      const { lastCreatedAt, lastId } = cursorData;
      
      const courses = await ctx.db
        .query("courses")
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
      
      const hasMore = courses.length > limit;
      const pageResults = hasMore ? courses.slice(0, limit) : courses;
      
      return {
        courses: pageResults,
        hasMore,
        nextCursor: hasMore ? JSON.stringify({
          lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
          lastId: pageResults[pageResults.length - 1]._id
        }) : undefined,
      };
    }
    
    // Default: return first page
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_creation")
      .order("desc")
      .take(limit + 1);
    
    const hasMore = courses.length > limit;
    const pageResults = hasMore ? courses.slice(0, limit) : courses;
    
    return {
      courses: pageResults,
      hasMore,
      nextCursor: hasMore ? JSON.stringify({
        lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
        lastId: pageResults[pageResults.length - 1]._id
      }) : undefined,
    };
  },
});

// Dedicated search function for better performance
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50); // Smaller limit for search
    const searchQuery = args.query.toLowerCase().trim();
    
    if (!searchQuery) {
      return { courses: [], hasMore: false, nextCursor: undefined };
    }
    
    // Get all courses and filter (unfortunately necessary for contains search in Convex)
    const allCourses = await ctx.db.query("courses").order("desc").collect();
    
    // Filter courses by search query
    const filteredCourses = allCourses.filter((course) => 
      course.courseCode.toLowerCase().includes(searchQuery) ||
      course.title.toLowerCase().includes(searchQuery)
    );
    
    // Handle pagination
    if (args.cursor) {
      const cursorData = JSON.parse(args.cursor);
      const { lastCreatedAt, lastId } = cursorData;
      
      const paginatedResults = filteredCourses.filter(course => 
        course.createdAt < lastCreatedAt || 
        (course.createdAt === lastCreatedAt && course._id < lastId)
      );
      
      const pageResults = paginatedResults.slice(0, limit);
      const hasMore = paginatedResults.length > limit;
      
      return {
        courses: pageResults,
        hasMore,
        nextCursor: hasMore ? JSON.stringify({
          lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
          lastId: pageResults[pageResults.length - 1]._id
        }) : undefined,
      };
    }
    
    // First page of search results
    const pageResults = filteredCourses.slice(0, limit);
    const hasMore = filteredCourses.length > limit;
    
    return {
      courses: pageResults,
      hasMore,
      nextCursor: hasMore ? JSON.stringify({
        lastCreatedAt: pageResults[pageResults.length - 1].createdAt,
        lastId: pageResults[pageResults.length - 1]._id
      }) : undefined,
    };
  },
});

// Create a new course
export const create = mutation({
  args: {
    courseCode: v.string(),
    title: v.string(),
    units: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate course code format
    if (!args.courseCode || args.courseCode.length < 3 || args.courseCode.length > 20) {
      throw new Error("INVALID_COURSE_CODE");
    }
    
    // Validate title
    if (!args.title || args.title.length < 1 || args.title.length > 200) {
      throw new Error("INVALID_TITLE");
    }
    
    // Validate units range if provided
    if (args.units !== undefined && (args.units <= 0 || args.units > 6.0)) {
      throw new Error("INVALID_UNITS");
    }
    
    // Check for duplicate course code
    const existingCourse = await ctx.db
      .query("courses")
      .withIndex("by_code", (q) => q.eq("courseCode", args.courseCode))
      .first();
    
    if (existingCourse) {
      return existingCourse;
    }
    
    // Create the course
    const now = Date.now();
    const courseId = await ctx.db.insert("courses", {
      courseCode: args.courseCode,
      title: args.title,
      units: args.units ?? 3,
      createdAt: now,
      updatedAt: now,
    });
    
    // Return the created course
    const course = await ctx.db.get(courseId);
    return course;
  },
});

// Mass create courses
export const massCreate = mutation({
  args: {
    courses: v.array(v.object({
      courseCode: v.string(),
      title: v.string(),
      units: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const results: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      created: any[];
      skipped: Array<{
        courseData: {
          courseCode: string;
          title: string;
          units?: number;
        };
        reason: string;
        index: number;
      }>;
      errors: Array<{
        courseData: {
          courseCode: string;
          title: string;
          units?: number;
        };
        error: string;
        index: number;
      }>;
    } = {
      created: [],
      skipped: [],
      errors: [],
    };

    // Validate input array
    if (!args.courses || args.courses.length === 0) {
      throw new Error("NO_COURSES_PROVIDED");
    }

    if (args.courses.length > 100) {
      throw new Error("TOO_MANY_COURSES");
    }

    // Get existing course codes for duplicate checking
    const existingCourses = await ctx.db.query("courses").collect();
    const existingCodes = new Set(existingCourses.map(course => course.courseCode.toLowerCase()));

    // Track codes we've seen in this batch to detect duplicates within batch
    const batchCodes = new Set<string>();

    // Process each course
    for (let i = 0; i < args.courses.length; i++) {
      const courseData = args.courses[i];

      try {
        // Validate course code format
        if (!courseData.courseCode || courseData.courseCode.length < 3 || courseData.courseCode.length > 20) {
          throw new Error("INVALID_COURSE_CODE");
        }

        const courseCodeLower = courseData.courseCode.toLowerCase();

        // Check for duplicate within this batch
        if (batchCodes.has(courseCodeLower)) {
          console.log(`Skipping course ${courseData.courseCode} (index ${i}): duplicate in batch`);
          results.skipped.push({
            courseData,
            reason: "DUPLICATE_IN_BATCH",
            index: i,
          });
          continue;
        }

        // Check for duplicate against existing courses
        if (existingCodes.has(courseCodeLower)) {
          console.log(`Skipping course ${courseData.courseCode} (index ${i}): already exists`);
          results.skipped.push({
            courseData,
            reason: "ALREADY_EXISTS",
            index: i,
          });
          continue;
        }

        // Add to batch codes to prevent duplicates within this batch
        batchCodes.add(courseCodeLower);

        // Validate title
        if (!courseData.title || courseData.title.length < 1 || courseData.title.length > 200) {
          throw new Error("INVALID_TITLE");
        }

        // Validate units range if provided
        if (courseData.units !== undefined && (courseData.units <= 0 || courseData.units > 6.0)) {
          throw new Error("INVALID_UNITS");
        }

        // Create the course
        const now = Date.now();
        const courseId = await ctx.db.insert("courses", {
          courseCode: courseData.courseCode,
          title: courseData.title,
          units: courseData.units ?? 3,
          createdAt: now,
          updatedAt: now,
        });

        // Get the created course and add to results
        const course = await ctx.db.get(courseId);
        if (course) {
          console.log(`Successfully created course ${courseData.courseCode} (index ${i})`);
          results.created.push(course);
          // Add to existing codes to prevent creating duplicates in future iterations
          existingCodes.add(courseCodeLower);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "UNKNOWN_ERROR";
        console.log(`Failed to create course ${courseData.courseCode} (index ${i}): ${errorMessage}`);
        results.errors.push({
          courseData,
          error: errorMessage,
          index: i,
        });
      }
    }

    console.log(`Mass create summary: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} failed`);

    return results;
  },
});

// Update an existing course
export const update = mutation({
  args: {
    id: v.id("courses"),
    courseCode: v.optional(v.string()),
    title: v.optional(v.string()),
    units: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the existing course
    const existingCourse = await ctx.db.get(args.id);
    if (!existingCourse) {
      throw new Error("COURSE_NOT_FOUND");
    }
    
    // Validate updates if provided
    if (args.courseCode !== undefined) {
      if (args.courseCode.length < 3 || args.courseCode.length > 20) {
        throw new Error("INVALID_COURSE_CODE");
      }
      
      // Check for duplicate course code (excluding current course)
      const duplicateCourse = await ctx.db
        .query("courses")
        .withIndex("by_code", (q) => q.eq("courseCode", args.courseCode!))
        .first();
      
      if (duplicateCourse && duplicateCourse._id !== args.id) {
        throw new Error("DUPLICATE_COURSE_CODE");
      }
    }
    
    if (args.title !== undefined && (args.title.length < 1 || args.title.length > 200)) {
      throw new Error("INVALID_TITLE");
    }
    
    if (args.units !== undefined && (args.units <= 0 || args.units > 6.0)) {
      throw new Error("INVALID_UNITS");
    }
    
    // Update the course
    const updateData: Partial<{
      courseCode: string;
      title: string;
      units: number;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };
    
    if (args.courseCode !== undefined) updateData.courseCode = args.courseCode;
    if (args.title !== undefined) updateData.title = args.title;
    if (args.units !== undefined) updateData.units = args.units;
    
    await ctx.db.patch(args.id, updateData);
    
    // Return the updated course
    return await ctx.db.get(args.id);
  },
});

// Get course by course code
export const getByCode = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_code", (q) => q.eq("courseCode", args.courseCode))
      .first();
    
    if (!course) {
      throw new Error("COURSE_NOT_FOUND");
    }
    
    return course;
  },
});

// Get multiple courses by course codes
export const getByCodes = query({
  args: {
    courseCodes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const courses = await Promise.all(
      args.courseCodes.map(async (courseCode) => {
        const course = await ctx.db
          .query("courses")
          .withIndex("by_code", (q) => q.eq("courseCode", courseCode))
          .first();
        return course;
      })
    );
    
    // Filter out null results (courses not found)
    const validCourses = courses.filter((course): course is NonNullable<typeof course> => course !== null);
    
    return validCourses;
  },
});

// Delete a course
export const remove = mutation({
  args: {
    id: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // Get the course
    const course = await ctx.db.get(args.id);
    if (!course) {
      throw new Error("COURSE_NOT_FOUND");
    }
    
    // Check if course is used in any templates (now checking by course code)
    const templates = await ctx.db.query("templates").collect();
    
    for (const template of templates) {
      const hasReference = template.semesters.some(semester =>
        semester.courses.includes(course.courseCode)
      );
      if (hasReference) {
        throw new Error("COURSE_IN_USE");
      }
    }
    
    // Delete the course
    await ctx.db.delete(args.id);
    
    return {
      deleted: true,
      id: args.id,
    };
  },
});