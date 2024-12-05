const nodeMailer = require('nodemailer');
const mailMd = require('../models/mail');
require('dotenv/models');

exports.sendMail = (to, subject, htmlContent) => {
    const transport = nodeMailer.createTransport({
        host: mailMd.HOST,
        port: mailMd.PORT,
        secure: false,
        auth: {
            user: mailMd.USERNAME,
            pass: mailMd.PASSWORD,
        }
    })

    const options = {
        from: mailMd.FROM_ADDRESS,
        to: to,
        subject: subject,
        html: htmlContent
    }
    
    return transport.sendMail(options);
    
}
