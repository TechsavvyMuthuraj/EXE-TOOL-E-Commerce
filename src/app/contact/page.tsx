'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        honeypot: '', // anti-spam
    });

    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('LOADING');
        setErrorMessage('');

        if (formData.message.length < 10) {
            setStatus('ERROR');
            setErrorMessage('Message must be at least 10 characters long.');
            return;
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Transmission failed.');
            }

            setStatus('SUCCESS');
        } catch (error: any) {
            setStatus('ERROR');
            setErrorMessage(error.message || 'An unexpected system error occurred.');
        }
    };

    return (
        <div className={styles.page}>
            <div className={`container ${styles.contactContainer}`}>

                {/* Left Column - Contact Info */}
                <div className={styles.leftColumn}>
                    <h1 className={styles.heading}>Contact Us</h1>
                    <p className={styles.tagline}>
                        We are available for questions, feedback, or collaboration opportunities. Let us know how we can help!
                    </p>
                    <p className={styles.tagline}>
                        You can also contact us at <br />
                        <a href="mailto:techsavvy.muthuraj.dev@gmail.com" className={styles.emailLink}>techsavvy.muthuraj.dev@gmail.com</a> for any payment or course access related queries.
                    </p>

                    <div className={styles.imagePlaceholder}>
                        <img
                            src="https://i.ibb.co/tPPbT9WD/Muthuraj-C.jpg" alt="Muthuraj C"

                            className={styles.contactImage}
                            onError={(e) => {
                                // Fallback if image doesn't exist
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231a1a1a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23333" font-family="sans-serif" font-size="20">Image Placeholder</text></svg>';
                            }}
                        />
                    </div>
                </div>

                {/* Right Column - Application Form */}
                <div className={styles.rightColumn}>
                    {status === 'SUCCESS' ? (
                        <div className={styles.successCard}>
                            <div className={styles.successIcon}>✓</div>
                            <h2>Message Sent</h2>
                            <p className={styles.tagline} style={{ margin: '1rem auto' }}>
                                Your message has been sent successfully. We will get back to you soon.
                            </p>
                            <button
                                className={styles.newTicketBtn}
                                onClick={() => {
                                    setStatus('IDLE');
                                    setFormData({ name: '', email: '', phone: '', subject: '', message: '', honeypot: '' });
                                }}
                            >
                                Send Another Message
                            </button>
                        </div>
                    ) : (
                        <form className={styles.form} onSubmit={handleSubmit}>

                            {/* HONEYPOT (Anti-Spam hidden field) */}
                            <input
                                type="text"
                                name="honeypot"
                                value={formData.honeypot}
                                onChange={handleInputChange}
                                className={styles.honeypot}
                                tabIndex={-1}
                                autoComplete="off"
                            />

                            <div className={styles.inputGroup}>
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className={styles.input}
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Your Name"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className={styles.input}
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Email"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    className={styles.input}
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Your 10-digit Indian Number"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    required
                                    className={styles.input}
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    placeholder="Subject"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    className={styles.input}
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="Type your message here."
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {status === 'ERROR' && (
                                <div className={styles.errorText}>
                                    ⚠️ {errorMessage}
                                </div>
                            )}

                            {/* Fake reCAPTCHA */}
                            <div className={styles.recaptchaMock}>
                                <div className={styles.recaptchaLeft}>
                                    <input type="checkbox" id="recaptcha-check" className={styles.recaptchaCheck} required />
                                    <label htmlFor="recaptcha-check">I'm not a robot</label>
                                </div>
                                <div className={styles.recaptchaRight}>
                                    <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" width="32" />
                                    <span>reCAPTCHA</span>
                                    <small>Privacy - Terms</small>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={status === 'LOADING'}
                            >
                                {status === 'LOADING' ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
