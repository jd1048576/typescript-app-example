import { ApolloServer, gql } from "apollo-server";
import axios from "axios";
import { readFileSync } from "fs";
import level, { Level } from "level";
import { resolve } from "path";
import { inspect } from "util";

const db: Level = level("level");

interface RemoteShow {
  backdrop_path: string | null;
  episode_run_time: number[];
  first_air_date: string;
  genres: { id: string; name: string }[];
  homepage: string;
  id: number;
  in_production: boolean;
  last_air_date: string;
  name: string;
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  seasons: {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
  }[];
  status: string;
  tagline: string;
  type: string;
  vote_average: number;
  vote_count: number;
}

interface RemoteSeason {
  air_date: string;
  episodes: {
    air_date: string;
    episode_number: string;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    still_path: string;
    vote_average: number;
    vote_count: number;
  }[];
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
}

interface Episode {
  airDate: string;
  episodeNumber: string;
  id: number;
  name: string;
  overview: string;
  productionCode: string;
  stillPath: string;
  voteAverage: number;
  voteCount: number;
}

interface Season {
  airDate: string;
  episodes: Episode[];
  id: number;
  name: string;
  overview: string;
  posterPath: string | null;
  seasonNumber: number;
}

interface Show {
  backdropPath: string | null;
  episodeRunTime: number;
  id: string;
  name: string;
  overview: string;
  popularity: number;
  posterPath: string | null;
  seasons: Season[];
  status: string;
  tagline: string;
  type: string;
  voteAverage: number;
  voteCount: number;
}

const get = async <T>(id: string, fetch: () => Promise<T>): Promise<T> => {
  let wrapper: {
    date: number;
    item: T;
  } | void = await db
    .get(id)
    .then(JSON.parse)
    .catch((error: unknown) => {
      if (error && !(error as Record<string, unknown>).notFound) {
        throw error;
      }
    });

  if (!wrapper) {
    wrapper = { item: await fetch(), date: new Date().getTime() };
    await db.put(id, JSON.stringify(wrapper));
  }
  console.log(inspect(wrapper, { colors: true }));

  return wrapper.item;
};

const show = async (id: string): Promise<Show> =>
  get<Omit<RemoteShow, "seasons"> & { seasons: RemoteSeason[] }>(id, async () => {
    const { data } = await axios.get<RemoteShow>(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.API_KEY}`
    );

    const seasons = await Promise.all(
      data.seasons.map((season) =>
        axios
          .get<RemoteSeason>(
            `https://api.themoviedb.org/3/tv/${id}/season/${season.season_number}?api_key=${process.env.API_KEY}`
          )
          .then(({ data }) => data)
      )
    );

    return { ...data, seasons };
  }).then((data) => ({
    backdropPath: data.backdrop_path,
    episodeRunTime: data.episode_run_time[0] ?? 0,
    id: `${data.id}`,
    name: data.name,
    overview: data.overview,
    popularity: data.popularity,
    posterPath: data.poster_path,
    seasons: data.seasons.map((season) => ({
      airDate: season.air_date,
      episodes: season.episodes.map((episode) => ({
        airDate: episode.air_date,
        episodeNumber: episode.episode_number,
        id: episode.id,
        name: episode.name,
        overview: episode.overview,
        productionCode: episode.production_code,
        stillPath: episode.still_path,
        voteAverage: episode.vote_average,
        voteCount: episode.vote_count
      })),
      id: season.id,
      name: season.name,
      overview: season.overview,
      posterPath: season.poster_path,
      seasonNumber: season.season_number
    })),
    status: data.status,
    tagline: data.tagline,
    type: data.type,
    voteAverage: data.vote_average,
    voteCount: data.vote_count
  }));

const resolvers = {
  Query: {
    show: async (_: unknown, params: { id: string }): Promise<Show> => show(params.id)
  }
};

const typeDefs = gql(readFileSync(resolve(__dirname, "..", "schema.graphql"), { encoding: "utf8" }));

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
