class APIFeatures {
    constructor(query, queryString) {
        this.query = query;        // Tour.find()
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => { delete queryObj[el] });       // removing all fields not required in query

        let queryStr = JSON.stringify(queryObj);        // { duration: '5', difficulty: { gte: 'easy' } }
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;    // this means the  entire object
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' '); // Convert comma-separated fields to space-separated fields - price,ratingsAverage
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');         // -fields  the '-' sign means sort it descending way(ulta)
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);        // projecting / '–' and '-' both dash are diff. we need to use first one
        } else {
            this.query = this.query.select('-__v');         // '-' means every field except the '__v' fields
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;   //page hai to first nahi to default value 1
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);       // page=2&limit=10, 1-10 / page 1, 11-20 / page 2

        return this;
    }
}

module.exports = APIFeatures;