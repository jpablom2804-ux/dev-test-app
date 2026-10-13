const categoriesRepository = require("../repositories/categoriesRepository");

function list() {
  return categoriesRepository.findAll();
}

module.exports = {
  list,
};
