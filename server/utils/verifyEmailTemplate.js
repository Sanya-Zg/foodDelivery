const verifyEmailTemplate = ({ name, url }) => {
  return `
  <p>Dear ${name}</p>
  <p>Thank you for registering Binkeyit.</p>
  <a href=${url} style='padding: 10px 20px; background: #007BFF; color: white; text-decoration: none; border-radius: 5px;'>
    Verify Email
  </a>
  `;
};

export default verifyEmailTemplate;
