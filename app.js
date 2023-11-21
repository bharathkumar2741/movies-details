const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express();

const dbpath = path.join(__dirname, 'moviesData.db')

app.use(express.json())

let db = null;

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
intializeDBAndServer()

const convertMovieDbObjectToResponsiveObject = dbobject => {
  return {
    movieId: dbobject.movie_id,
    directorId: dbobject.director_id,
    movieName: dbobject.movie_name,
    leadActor: dbobject.lead_actor,
  }
}

const convertDirectorDbObjectToResponsiveObject = dbobject => {
  return {
    directorId: dbobject.director_id,
    directorName: dbobject.director_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getMovieQuery = `
    SELECT movie_name
    FROM
    movie;
    `
  const movieArray = await db.all(getMovieQuery)
  response.send(movieArray.map(i => ({movieName: i.movie_name})))
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      movie
    WHERE 
      movie_id = ${movieId};`
  const player = await db.get(getPlayerQuery)
  response.send(convertMovieDbObjectToResponsiveObject(player))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const postMovieQuery = `
  INSERT INTO
    movie (director_id, movie_name , lead_actor)
    VALUES 
    (${directorId},'${movieName}','${leadActor}');`
  await db.run(postMovieQuery)
  response.send('Movie Successfully Added')
})

app.put("/movies/:movieId/", async (request, response) => {
  const {directorId, movieName, leadActor} = request.body;
  const {movieId} = request.params;
  const updateMovieQuery = `
  UPDATE
    movie
  SET
  director_id=${directorId},
  movie_name= '${movieName}',
  lead_actor= '${leadActor}'
  WHERE
    movie_id = ${movieId};`

  await db.run(updateMovieQuery);
  response.send('Movie Details Updated');
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE FROM
    movie
  WHERE
    movie_id = ${movieId};`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getMovieQuery = `
    SELECT *
    FROM
    director;
    `
  const movieArray = await db.all(getMovieQuery)
  response.send(
    movieArray.map(i => convertDirectorDbObjectToResponsiveObject(i)),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getPlayerQuery = `
    SELECT 
      movie_name
    FROM 
      movie
    WHERE 
      director_id = '${directorId}';`
  const player = await db.all(getPlayerQuery)
  response.send(player.map(i => ({movieName: i.movie_name})))
})

module.exports = app
