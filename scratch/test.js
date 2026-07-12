const nodemailer = require("nodemailer");

async function run() {
  console.log("Testing email...");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS on port 587
    auth: {
      user: "veritasco.tech@gmail.com",
      pass: "udmd fcse murp gmdg",
    },
  });

  try {
    const start = Date.now();
    await transporter.verify();
    console.log("Email connected successfully in", Date.now() - start, "ms");
  } catch (err) {
    console.error("Email failed:", err);
  }


}

run();
