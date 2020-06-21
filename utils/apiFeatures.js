class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const exculdedFields = ['limit', 'sort', 'page', 'fields'];

    exculdedFields.forEach((el) => delete queryObj[el]);

    this.query.find(queryObj);
    return this;
  }

  sort() {
    this.query.sort('-createdAt');
    return this;
  }

  limitFields() {
    this.query.select('-__v -content');
    return this;
  }

  pagination() {
    const page = this.query.page * 1 || 1;
    const limit = this.query.limit * 1 || 20;
    const skip = (page - 1) * limit;

    this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
