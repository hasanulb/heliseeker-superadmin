declare module "nodemailer" {
  const nodemailer: {
    createTransport: (...args: any[]) => {
      sendMail: (...args: any[]) => Promise<unknown>
    }
  }

  export default nodemailer
}

