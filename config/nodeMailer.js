const sender = 'smtps://bogdan.bucur@udevoffice.ro',
    password = 'l0standdamnd',
    nodeMailer = require("nodemailer"),
    EmailTemplate = require('email-templates').EmailTemplate,
    transporter = nodeMailer.createTransport(sender + ':' + password + '@smtp.gmail.com');

// create template based sender function
// assumes text.{ext} and html.{ext} in template/directory
const sendResetPasswordLink = transporter.templateSender(
    new EmailTemplate('./templates/resetPassword'), {
        from: 'hello@yourdomain.com',
    });

exports.sendPasswordReset = function (email, username, name, tokenUrl) {
    // transporter.template
    sendResetPasswordLink({
        to: email,
        subject: 'MaPet - Confirm your email'
    }, {
        name: name,
        username: username,
        token: tokenUrl
    }, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log('Link sent\n'+ JSON.stringify(info));
        }
    });
};