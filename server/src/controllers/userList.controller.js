import { matchedData } from 'express-validator';
import { addToUserList, getUserList, removeFromUserList } from '../services/userList.service.js';

// Фабрика: один набор обработчиков для favorites, watchlist и watched
export function createUserListController(listName) {
  return {
    async list(req, res, next) {
      try {
        const filters = matchedData(req, { locations: ['query'] });
        res.json(await getUserList(listName, req.user.id, filters));
      } catch (error) {
        next(error);
      }
    },

    async add(req, res, next) {
      try {
        const { movieId } = matchedData(req, { locations: ['body'] });
        res.status(201).json(await addToUserList(listName, req.user.id, movieId));
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        const { movieId } = matchedData(req, { locations: ['params'] });
        await removeFromUserList(listName, req.user.id, movieId);
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  };
}
