const User = require('../models/users');

const UserService = require('../services/user');
const { ResponseError } = require('../utils');

class GameService {
    async magicCubeFinished (playerId) {
        const user = await User.findById(playerId);
        if (!user) throw new ResponseError(404, 'user not found');

        await UserService.updateMeterEXP(playerId, 'playMagicCube');
    }

    async solveThemFinished (playerId) {
        const user = await User.findById(playerId);
        if (!user) throw new ResponseError(404, 'user not found');

        await UserService.updateMeterEXP(playerId, 'playSolveThem');
    }
}

module.exports = new GameService();