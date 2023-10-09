module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);     // imp - alternative of try-catch block
    }
}