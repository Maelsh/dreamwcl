const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Fallback: Log to console instead of sending email
        return {
            sendMail: (options) => {
                logger.info('Email would be sent:', {
                    to: options.to,
                    subject: options.subject,
                    template: options.template
                });
                return Promise.resolve();
            }
        };
    }
};

const transporter = createTransporter();

// Email templates
const getEmailTemplate = (template, data) => {
    const templates = {
        welcome: {
            subject: 'مرحباً بك في منصة Dueli',
            html: `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #0a84ff; text-align: center; margin-bottom: 30px;">مرحباً بك في منصة Dueli</h1>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">عزيزي ${data.name}،</p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            أهلاً وسهلاً بك في منصة Dueli للمنافسات التفاعلية! نحن سعداء بانضمامك إلينا.
                        </p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            يمكنك الآن تسجيل الدخول إلى حسابك والبدء في استكشاف المنصة والمشاركة في المنافسات المثيرة.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${data.loginUrl}" style="display: inline-block; background-color: #0a84ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                تسجيل الدخول
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                            إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.
                        </p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            منصة Dueli للمنافسات التفاعلية<br>
                            © 2024 MiniMax Agent. جميع الحقوق محفوظة.
                        </p>
                    </div>
                </div>
            `
        },
        
        passwordReset: {
            subject: 'إعادة تعيين كلمة المرور - منصة Dueli',
            html: `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #0a84ff; text-align: center; margin-bottom: 30px;">إعادة تعيين كلمة المرور</h1>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">عزيزي ${data.name}،</p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            لقد طلبت إعادة تعيين كلمة مرور حسابك في منصة Dueli.
                        </p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            يرجى النقر على الرابط أدناه لإعادة تعيين كلمة المرور. هذا الرابط صالح لمدة ${data.expiresIn}.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${data.resetURL}" style="display: inline-block; background-color: #0a84ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                إعادة تعيين كلمة المرور
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                            إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.
                        </p>
                        <p style="font-size: 12px; color: #999;">
                            للأمان، سيتم إلغاء هذا الرابط بعد انتهاء مدته.
                        </p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            منصة Dueli للمنافسات التفاعلية<br>
                            © 2024 MiniMax Agent. جميع الحقوق محفوظة.
                        </p>
                    </div>
                </div>
            `
        },
        
        emailVerification: {
            subject: 'تأكيد البريد الإلكتروني - منصة Dueli',
            html: `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #0a84ff; text-align: center; margin-bottom: 30px;">تأكيد البريد الإلكتروني</h1>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">عزيزي ${data.name}،</p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            شكراً لتسجيلك في منصة Dueli! يرجى تأكيد بريدك الإلكتروني لإكمال عملية التسجيل.
                        </p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            اضغط على الرابط أدناه لتأكيد بريدك الإلكتروني. هذا الرابط صالح لمدة ${data.expiresIn}.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${data.verificationURL}" style="display: inline-block; background-color: #0a84ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                تأكيد البريد الإلكتروني
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #999;">
                            إذا لم تقم بإنشاء حساب في منصة Dueli، يرجى تجاهل هذا البريد الإلكتروني.
                        </p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            منصة Dueli للمنافسات التفاعلية<br>
                            © 2024 MiniMax Agent. جميع الحقوق محفوظة.
                        </p>
                    </div>
                </div>
            `
        },

        competitionInvite: {
            subject: 'دعوة للانضمام لمنافسة - منصة Dueli',
            html: `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #0a84ff; text-align: center; margin-bottom: 30px;">دعوة للانضمام</h1>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">عزيزي ${data.name}،</p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            لقد تم دعوتك للانضمام في منافسة "${data.competitionTitle}" في منصة Dueli.
                        </p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            تاريخ المنافسة: ${data.competitionDate}<br>
                            المدة: ${data.competitionDuration}<br>
                            الفئة: ${data.competitionCategory}
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${data.joinURL}" style="display: inline-block; background-color: #0a84ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">
                                الانضمام للمنافسة
                            </a>
                            <a href="${data.viewURL}" style="display: inline-block; background-color: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">
                                عرض التفاصيل
                            </a>
                        </div>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            منصة Dueli للمنافسات التفاعلية<br>
                            © 2024 MiniMax Agent. جميع الحقوق محفوظة.
                        </p>
                    </div>
                </div>
            `
        },

        earningsNotification: {
            subject: 'إشعار أرباح جديدة - منصة Dueli',
            html: `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #28a745; text-align: center; margin-bottom: 30px;">تهانينا! أرباح جديدة</h1>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">عزيزي ${data.name}،</p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            تهانينا! لقد حصلت على أرباح جديدة من منصتنا.
                        </p>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                            <h2 style="color: #28a745; margin: 0;">${data.amount} ${data.currency}</h2>
                            <p style="margin: 5px 0 0 0; color: #666;">مبلغ الربح</p>
                        </div>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            تفاصيل الأرباح:<br>
                            المنافسة: ${data.competitionTitle}<br>
                            تاريخ المنافسة: ${data.competitionDate}<br>
                            نوع الأرباح: ${data.earningType}
                        </p>
                        <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
                            يمكنك طلب سحب هذه الأرباح من خلال لوحة التحكم.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${data.dashboardURL}" style="display: inline-block; background-color: #0a84ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                الذهاب للوحة التحكم
                            </a>
                        </div>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            منصة Dueli للمنافسات التفاعلية<br>
                            © 2024 MiniMax Agent. جميع الحقوق محفوظة.
                        </p>
                    </div>
                </div>
            `
        },

        systemMaintenance: {
            subject: 'إشعار صيانة النظام - منصة Dueli',
            html: `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #ffc107; text-align: center; margin-bottom: 30px;">إشعار صيانة النظام</h1>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">عزيزي المستخدم،</p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            نود إعلامك بأن منصة Dueli ستخضع لصيانة مجدولة.
                        </p>
                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <p style="margin: 0; font-weight: bold;">معلومات الصيانة:</p>
                            <p style="margin: 10px 0 0 0;">
                                تاريخ الصيانة: ${data.maintenanceDate}<br>
                                وقت الصيانة: ${data.maintenanceTime}<br>
                                المدة المتوقعة: ${data.estimatedDuration}<br>
                                السبب: ${data.maintenanceReason}
                            </p>
                        </div>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            ${data.maintenanceMessage || 'أثناء فترة الصيانة، قد لا تكون بعض الخدمات متاحة مؤقتاً.'}
                        </p>
                        <p style="font-size: 14px; color: #666;">
                            نشكرك على صبرك ونعتذر عن أي إزعاج.
                        </p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            منصة Dueli للمنافسات التفاعلية<br>
                            © 2024 MiniMax Agent. جميع الحقوق محفوظة.
                        </p>
                    </div>
                </div>
            `
        }
    };

    return templates[template];
};

// Main email sending function
const sendEmail = async (options) => {
    try {
        const { template, data, to, subject, attachments = [] } = options;
        
        let emailContent;
        if (template) {
            const templateData = getEmailTemplate(template, data);
            emailContent = {
                from: process.env.EMAIL_FROM || 'noreply@duelik.com',
                to: to,
                subject: templateData.subject,
                html: templateData.html,
                attachments
            };
        } else {
            // Custom email
            emailContent = {
                from: process.env.EMAIL_FROM || 'noreply@duelik.com',
                to: to,
                subject: subject,
                html: data.html,
                attachments
            };
        }

        const info = await transporter.sendMail(emailContent);
        
        logger.info('Email sent successfully', {
            to: to,
            subject: emailContent.subject,
            messageId: info.messageId
        });

        return info;
    } catch (error) {
        logger.error('Failed to send email', {
            error: error.message,
            to: options.to,
            template: options.template
        });
        throw error;
    }
};

// Utility functions for specific email types
const sendWelcomeEmail = (userEmail, userName, loginUrl) => {
    return sendEmail({
        to: userEmail,
        template: 'welcome',
        data: { name: userName, loginUrl }
    });
};

const sendPasswordResetEmail = (userEmail, userName, resetURL, expiresIn = 'ساعة واحدة') => {
    return sendEmail({
        to: userEmail,
        template: 'passwordReset',
        data: { name: userName, resetURL, expiresIn }
    });
};

const sendVerificationEmail = (userEmail, userName, verificationURL, expiresIn = '24 ساعة') => {
    return sendEmail({
        to: userEmail,
        template: 'emailVerification',
        data: { name: userName, verificationURL, expiresIn }
    });
};

const sendCompetitionInvite = (userEmail, userName, competitionData) => {
    return sendEmail({
        to: userEmail,
        template: 'competitionInvite',
        data: {
            name: userName,
            ...competitionData
        }
    });
};

const sendEarningsNotification = (userEmail, userName, earningsData) => {
    return sendEmail({
        to: userEmail,
        template: 'earningsNotification',
        data: {
            name: userName,
            ...earningsData
        }
    });
};

const sendSystemMaintenanceNotification = (maintenanceData) => {
    return sendEmail({
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_FROM,
        template: 'systemMaintenance',
        data: maintenanceData
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendVerificationEmail,
    sendCompetitionInvite,
    sendEarningsNotification,
    sendSystemMaintenanceNotification
};