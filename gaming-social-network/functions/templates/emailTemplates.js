const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gaming Social Network Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #7289da;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
    }
    .user-info {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Gaming Social Network</h2>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent from Gaming Social Network</p>
      <p>
        <a href="{unsubscribe_link}">Unsubscribe</a> from these notifications
      </p>
    </div>
  </div>
</body>
</html>
`;

const likeTemplate = (data) => baseTemplate(`
  <div class="user-info">
    <img src="${data.actionUser.photoURL || '/default-avatar.png'}" alt="User avatar" class="avatar">
    <h3>${data.actionUser.username} liked your post</h3>
  </div>
  <p>Your post received a new like!</p>
  <blockquote style="border-left: 3px solid #7289da; padding-left: 10px; margin: 10px 0;">
    ${data.postContent.substring(0, 200)}${data.postContent.length > 200 ? '...' : ''}
  </blockquote>
  <a href="${data.postUrl}" class="button">View Post</a>
`);

const commentTemplate = (data) => baseTemplate(`
  <div class="user-info">
    <img src="${data.actionUser.photoURL || '/default-avatar.png'}" alt="User avatar" class="avatar">
    <h3>${data.actionUser.username} commented on your post</h3>
  </div>
  <p>New comment on your post:</p>
  <blockquote style="border-left: 3px solid #7289da; padding-left: 10px; margin: 10px 0;">
    "${data.commentContent}"
  </blockquote>
  <p>On your post:</p>
  <blockquote style="border-left: 3px solid #7289da; padding-left: 10px; margin: 10px 0;">
    ${data.postContent.substring(0, 200)}${data.postContent.length > 200 ? '...' : ''}
  </blockquote>
  <a href="${data.postUrl}" class="button">View Comment</a>
`);

const shareTemplate = (data) => baseTemplate(`
  <div class="user-info">
    <img src="${data.actionUser.photoURL || '/default-avatar.png'}" alt="User avatar" class="avatar">
    <h3>${data.actionUser.username} shared your post</h3>
  </div>
  <p>Your post was shared!</p>
  <blockquote style="border-left: 3px solid #7289da; padding-left: 10px; margin: 10px 0;">
    ${data.postContent.substring(0, 200)}${data.postContent.length > 200 ? '...' : ''}
  </blockquote>
  <a href="${data.postUrl}" class="button">View Original Post</a>
`);

const friendRequestTemplate = (data) => baseTemplate(`
  <div class="user-info">
    <img src="${data.actionUser.photoURL || '/default-avatar.png'}" alt="User avatar" class="avatar">
    <h3>${data.actionUser.username} sent you a friend request</h3>
  </div>
  <p>You have a new friend request!</p>
  <div style="text-align: center; margin-top: 20px;">
    <a href="${data.acceptUrl}" class="button" style="background-color: #43b581; margin-right: 10px;">Accept</a>
    <a href="${data.declineUrl}" class="button" style="background-color: #f04747;">Decline</a>
  </div>
`);

const messageTemplate = (data) => baseTemplate(`
  <div class="user-info">
    <img src="${data.actionUser.photoURL || '/default-avatar.png'}" alt="User avatar" class="avatar">
    <h3>New message from ${data.actionUser.username}</h3>
  </div>
  <p>You received a new message:</p>
  <blockquote style="border-left: 3px solid #7289da; padding-left: 10px; margin: 10px 0;">
    "${data.messagePreview}"
  </blockquote>
  <a href="${data.conversationUrl}" class="button">View Conversation</a>
`);

module.exports = {
  likeTemplate,
  commentTemplate,
  shareTemplate,
  friendRequestTemplate,
  messageTemplate
};
