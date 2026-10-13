const categoriesService = require("../services/categoriesService");

async function list(req, res) {
  res.json(await categoriesService.list());
}

module.exports = {
  list,
};
