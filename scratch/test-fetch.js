fetch("http://localhost:3000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "test", email: "test2@example.com", password: "password123" })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
