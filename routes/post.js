const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const app = require('../app');

router.route('/simple').get(postController.getPosts);
router.route('/simple/:postId').get(postController.getPost);
router.post(
  '/uploadImage',
  authController.protect,
  postController.uploadImage,
  postController.resizeImage
);

router.use(
  authController.protect,
  authController.restrictTo('author', 'admin')
);

router
  .route('/my-posts')
  .get(postController.getMyPosts)
  .post(
    postController.uploadCoverImage,
    postController.resizeCoverImage,
    postController.createPost
  );

router
  .route('/my-posts/:postId')
  .get(postController.getMyPost)
  .delete(postController.deleteMyPost)
  .patch(
    postController.uploadCoverImage,
    postController.resizeCoverImage,
    postController.editMyPost
  );

router.use(authController.restrictTo('admin'));

router.route('/all-posts').get(postController.getPostsByAdmin);
router.route('/all-posts/:postId').get(postController.getPostByAdmin);

router.post(
  '/approve/:postId',

  postController.approvePost
);
router.post(
  '/reject/:postId',

  postController.rejectPost
);

module.exports = router;
