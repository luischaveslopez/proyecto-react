# Gaming Social Network - Firebase Functions

This directory contains the Firebase Cloud Functions for handling real-time notifications and email delivery.

## Setup Instructions

1. Install dependencies:
```bash
cd functions
npm install
```

2. Configure environment variables:
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

3. Set up Firebase Functions configuration:
```bash
# Login to Firebase
firebase login

# Set environment variables
firebase functions:config:set email.user="your-email@gmail.com" email.pass="your-app-specific-password"
```

4. Deploy the functions:
```bash
npm run deploy
```

## Email Configuration

To use Gmail for sending notifications:

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account settings
   - Navigate to Security
   - Under "2-Step Verification", click on "App passwords"
   - Select "Mail" and your device
   - Use the generated password in your .env file

## Local Development

1. Start the Firebase emulator:
```bash
npm run serve
```

2. Use the Firebase Functions shell for testing:
```bash
npm run shell
```

## Notification Types

The system handles the following types of notifications:

1. Likes
   - When a user likes a post
   - Real-time notification to post author
   - Email notification with like details

2. Comments
   - When a user comments on a post
   - Real-time notification to post author
   - Email notification with comment preview

3. Shares
   - When a user shares a post
   - Real-time notification to original post author
   - Email notification with share details

4. Friend Requests
   - When a user sends a friend request
   - Real-time notification to request recipient
   - Email notification with requester details

5. Messages
   - When a user receives a new message
   - Real-time notification to message recipient
   - Email notification with message preview

## Email Templates

Each notification type has its own email template with:
- Custom subject line
- Formatted HTML content
- Action buttons/links
- User avatars and names
- Timestamps

## Security

- All functions verify user authentication
- Email notifications respect user privacy settings
- Rate limiting is implemented to prevent abuse
- Sensitive data is never exposed in notifications

## Troubleshooting

Common issues and solutions:

1. Emails not sending:
   - Verify email credentials in Firebase config
   - Check Gmail account settings
   - Ensure Firebase project is on Blaze plan

2. Notifications not appearing:
   - Check Firebase Console logs
   - Verify database security rules
   - Ensure user has proper permissions

3. Real-time updates not working:
   - Check client-side connection status
   - Verify WebSocket connections
   - Check browser console for errors

## Best Practices

1. Email Notifications:
   - Include unsubscribe links
   - Respect user notification preferences
   - Batch notifications when appropriate
   - Use responsive email templates

2. Real-time Notifications:
   - Implement read/unread status
   - Provide clear notification actions
   - Handle offline scenarios
   - Implement notification cleanup

## Contributing

When adding new notification types:

1. Create the notification handler in index.js
2. Add email template
3. Update NotificationService.js
4. Add notification type to constants
5. Update security rules if needed
