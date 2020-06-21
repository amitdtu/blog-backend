const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
    unique: true,
    maxlength: [70, 'title must be less than 70 characters'],
  },
  description: {
    type: String,
    required: true,
    maxlength: [150, 'description must be less than 150 characters'],
  },
  tags: {
    type: String,
    required: true,
    maxlength: [100, 'tags must be less than 100 characters'],
  },
  content: {
    type: String,
    required: true,
    // validate: {
    //   validator: function (desc) {
    //     return desc.length > 250 && desc.length < 700;
    //   },
    //   message: (props) => `description must be in between 250-700 characters. Your is ${props.value.length} `,
    // },
  },
  category: {
    type: String,
    enum: ['technology', 'health', 'trending', 'politics'],
    required: true,
  },
  coverImage: String,
  publish: {
    type: Number,
    default: 100,
  },
  slug: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

postSchema.index({ publish: 1 });

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// run before .save() and .create() function
postSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
