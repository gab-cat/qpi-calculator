import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  courses: defineTable({
    courseCode: v.string(),    // e.g., "ENGS101", "MATH101"
    title: v.string(),         // e.g., "English Communication", "Calculus I"
    units: v.number(),         // Credit hours, typically 1-6
    createdAt: v.number(),     // Timestamp for ordering
    updatedAt: v.number(),     // Last modification timestamp
  })
    .index("by_code", ["courseCode"])
    .index("by_creation", ["createdAt"])
    .index("by_title", ["title"])
    .index("by_code_creation", ["courseCode", "createdAt"])
    .index("by_title_creation", ["title", "createdAt"]),

  templates: defineTable({
    name: v.string(),          // e.g., "Computer Science Program", "Engineering Track"
    description: v.optional(v.string()), // Optional program description
    semesters: v.array(v.object({
      yearLevel: v.number(),   // 1, 2, 3, 4 (year in program)
      semesterType: v.union(   // "first", "second", "summer"
        v.literal("first"),
        v.literal("second"), 
        v.literal("summer")
      ),
      courses: v.array(v.string()), // Course codes instead of IDs
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_creation", ["createdAt"])
    .index("by_name_creation", ["name", "createdAt"]),
});