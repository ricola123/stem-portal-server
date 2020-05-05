const authorize = require('../middleware/authorize');

const GameService = require('../../services/game');

module.exports = router => {
    router.route('/game/:id/magic-cube').get(authorize(), async (req, res) => {
        const { id } = req.params;
        await GameService.magicCubeFinished(id);
        res.status(201).send();
    });
    router.route('/game/:id/solve-them').get(authorize(), async (req, res) => {
        const { id } = req.params;
        await GameService.solveThemFinished(id);
        res.status(201).send();
    });
};
