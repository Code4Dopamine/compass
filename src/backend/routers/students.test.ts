import test from "ava";
import { getTestServer } from "backend/tests";
import { string } from "zod";

test("getStudentById", async (t) => {
  const { trpc, db } = await getTestServer(t);

  const { student_id } = await db
    .insertInto("student")
    .values({
      first_name: "Foo",
      last_name: "Bar",
      email: "foo.bar@email.com",
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const student = await trpc.getStudentById.query({ student_id });
  t.is(student.student_id, student_id);
});

test("getAllStudents", async (t) => {
  const { trpc, db } = await getTestServer(t);

  const { student_id } = await db
    .insertInto("student")
    .values({
      first_name: "Foo",
      last_name: "Bar",
      email: "foo.bar@email.com",
      assigned_case_manager_id: "db37712a-a047-405c-9243-302394c4372a",
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const students = await trpc.getAllStudents.query({
    assigned_case_manager_id: "db37712a-a047-405c-9243-302394c4372a",
  });
  t.is(students.length, 1);
  t.is(students[0].student_id, student_id);
});

test("createStudent", async (t) => {
  const { trpc, db } = await getTestServer(t);

  await trpc.createStudent.mutate({
    first_name: "Foo",
    last_name: "Bar",
    email: "foo.bar@email.com",
    assigned_case_manager_id: "db37712a-a047-405c-9243-302394c4372a",
  });

  t.truthy(
    await db
      .selectFrom("student")
      .where("first_name", "=", "Foo")
      .selectAll()
      .executeTakeFirst()
  );
});

test("doNotAddDuplicateEmails", async (t) => {
  const { trpc, db } = await getTestServer(t);

  await db
    .insertInto("student")
    .values({
      first_name: "Foo",
      last_name: "Bar",
      email: "foo.bar@email.com",
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  await t.throwsAsync(() => {
    return trpc.createStudent.mutate({
      first_name: "Foos",
      last_name: "Bar",
      email: "foo.bar@email.com",
      assigned_case_manager_id: "db37712a-a047-405c-9243-302394c4372a",
    });
  });

  const students = await trpc.getAllStudents.query({
    assigned_case_manager_id: "db37712a-a047-405c-9243-302394c4372a",
  });
  t.is(students.length, 1);
});
