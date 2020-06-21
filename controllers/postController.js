const multer = require('multer');
const sharp = require('sharp');
const Post = require('../models/post');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only image.'));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadCoverImage = upload.single('coverImage');
exports.uploadImage = upload.single('img');

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `post-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/blogs/${req.file.filename}`);

  const url = `${req.protocol}://${req.headers.host}/img/blogs/${req.file.filename}`;
  res.status(200).json({
    status: 'success',
    url: url,
  });
});
exports.resizeCoverImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `post-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/posts/${req.file.filename}`);

  next();
});

exports.getPosts = catchAsync(async (req, res, next) => {
  const feature = new APIFeatures(Post.find(), req.query)
    .filter()
    .sort()
    .pagination()
    .limitFields();
  const posts = await feature.query.find({ publish: 101 });

  res.status(200).json({
    status: 'success',
    result: posts.length,
    data: posts,
  });
});
exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);

  res.status(200).json({
    status: 'success',
    data: post,
  });
});

// get posts by admin
exports.getPostsByAdmin = catchAsync(async (req, res, next) => {
  const feature = new APIFeatures(Post.find(), req.query)
    .filter()
    .sort()
    .pagination()
    .limitFields();
  const posts = await feature.query;


  res.status(200).json({
    status: 'success',
    result: posts.length,
    data: posts,
  });
});

exports.getPostByAdmin = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);

  res.status(200).json({
    status: 'success',
    data: post,
  });
});

exports.approvePost = catchAsync(async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findByIdAndUpdate(postId, { publish: 101 });

  res.status(200).json({
    status: 'success',
    message: 'Post approved successfully.',
  });
});

exports.rejectPost = catchAsync(async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findByIdAndUpdate(postId, { publish: 102 });

  res.status(200).json({
    status: 'success',
    message: 'Post rejected successfully.',
  });
});

exports.getMyPosts = catchAsync(async (req, res, next) => {
  const feature = new APIFeatures(Post.find(), req.query)
    .filter()
    .sort()
    .pagination()
    .limitFields();
  const myPosts = await feature.query.find({ author: req.user.id });

  res.status(200).json({
    status: 'success',
    result: myPosts.length,
    data: myPosts,
  });
});

exports.getMyPost = catchAsync(async (req, res, next) => {
  const post = await Post.findOne({
    _id: req.params.postId,
    author: req.user.id,
  }).select('-__v');

  if (!post)
    return next(
      new AppError(`No post found with id ${req.params.postId}`, 404)
    );

  res.status(200).json({
    status: 'success',
    data: post,
  });
});

exports.createPost = catchAsync(async (req, res, next) => {
  req.body.author = req.user._id;
  if (req.file) req.body.coverImage = req.file.filename;


  const post = await Post.create(req.body);

  res.status(200).json({
    status: 'success',
    data: post,
    message: 'Post created successfully.',
  });
});

exports.editMyPost = catchAsync(async (req, res, next) => {
  const { title, description, tags, category, content } = req.body;

  const objToBeUpdated = {
    title,
    description,
    tags,
    category,
    content,
    publish: 100,
  };

  if (req.file) objToBeUpdated.coverImage = req.file.filename;

  const post = await Post.findByIdAndUpdate(req.params.postId, objToBeUpdated);

  if (!post)
    return next(
      new AppError(`No post found with id ${req.params.postId}`, 404)
    );

  res.status(200).json({
    status: 'success',
    message: 'Post updated successfully.',
    data: post,
  });
});

exports.deleteMyPost = catchAsync(async (req, res, next) => {
  const post = await Post.findByIdAndDelete(req.params.postId);

  if (!post)
    return next(
      new AppError(`No post found with id ${req.params.postId}`, 404)
    );

  res.status(200).json({
    status: 'success',
    message: 'Post deleted successfully.',
  });
});
