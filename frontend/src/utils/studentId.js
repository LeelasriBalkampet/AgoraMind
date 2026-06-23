export function getOrCreateStudentId() {
  const key = 'agoramind_student_id';
  let id = localStorage.getItem(key);
  if (!id) {
    const randomUUID =
      globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID.bind(globalThis.crypto)
        : () => `student-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    id = randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
