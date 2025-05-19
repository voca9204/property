const nodemailer = require('nodemailer');
const { logger } = require('firebase-functions');

/**
 * Email service for sending notifications
 */
class EmailService {
  constructor() {
    // Initialize transporter with environment variables
    // These should be set in Firebase Functions config
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Or configure SMTP details
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@property-app.com';
  }
  
  /**
   * Send an email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} - Send result
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        ...options,
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to: options.to });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to });
      throw error;
    }
  }
  
  /**
   * Send a welcome email to a new user
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Send result
   */
  async sendWelcomeEmail(user) {
    const subject = '환영합니다! Property App에 가입해주셔서 감사합니다.';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>환영합니다, ${user.displayName || user.email}님!</h2>
        <p>Property App에 가입해주셔서 감사합니다. 이제 부동산 관리와 쇼케이스 제작을 시작하실 수 있습니다.</p>
        <p>문의사항이 있으시면 언제든지 연락 주세요.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            본 이메일은 발신전용입니다. 문의사항은 고객센터를 이용해주세요.
          </p>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }
  
  /**
   * Send property showcase notification
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} - Send result
   */
  async sendShowcaseNotification(data) {
    const subject = `새로운 쇼케이스: ${data.propertyTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${data.agent.name}님이 새로운 쇼케이스를 공유했습니다</h2>
        <h3>${data.propertyTitle}</h3>
        <p>${data.message || '아래 링크를 클릭하여 쇼케이스를 확인하세요.'}</p>
        
        <div style="margin: 30px 0;">
          <a href="${data.showcaseUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            쇼케이스 보기
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            본 이메일은 발신전용입니다. 궁금하신 점은 ${data.agent.name}님(${data.agent.email})에게 문의해 주세요.
          </p>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to: data.clientEmail,
      subject,
      html,
      from: data.agent.email, // Send on behalf of the agent
    });
  }
  
  /**
   * Send appointment confirmation
   * @param {Object} appointment - Appointment data
   * @returns {Promise<Object>} - Send result
   */
  async sendAppointmentConfirmation(appointment) {
    const subject = `방문 예약 확인: ${appointment.propertyTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>방문 예약이 확정되었습니다</h2>
        <h3>${appointment.propertyTitle}</h3>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>날짜:</strong> ${appointment.date}</p>
          <p><strong>시간:</strong> ${appointment.time}</p>
          <p><strong>위치:</strong> ${appointment.location}</p>
          <p><strong>담당자:</strong> ${appointment.agent.name}</p>
          <p><strong>연락처:</strong> ${appointment.agent.phone}</p>
        </div>
        
        <p>일정 변경이 필요하신 경우 최소 24시간 전에 연락해 주세요.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            본 이메일은 발신전용입니다. 궁금하신 점은 ${appointment.agent.name}님(${appointment.agent.email})에게 문의해 주세요.
          </p>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to: appointment.clientEmail,
      subject,
      html,
      from: appointment.agent.email,
    });
  }
}

module.exports = new EmailService();
