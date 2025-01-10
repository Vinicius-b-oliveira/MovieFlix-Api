import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/movies", async (_: Request, res: Response): Promise<void> => {
    try {
        const movies = await prisma.movie.findMany({
            orderBy: {
                title: "asc",
            },
            include: {
                genres: true,
                languages: true,
            },
        });
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar filmes", error: err });
    }
});

app.post("/movies", async (req: Request, res: Response): Promise<void> => {
    const { title, genre_id, language_id, oscar_count, release_date } =
        req.body;

    try {
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
        });

        if (movieWithSameTitle) {
            res.status(409).json({
                message: "Já existe um filme cadastrado com esse título",
            });
            return;
        }

        const newMovie = await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        });

        res.status(201).json({
            message: "Filme cadastrado com sucesso",
            movie: newMovie,
        });
    } catch (err) {
        res.status(400).json({
            message: "Falha ao cadastrar um filme",
            error: err,
        });
    }
});

app.put("/movies/:id", async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: { id },
        });

        if (!movie) {
            res.status(404).json({ message: "Filme não encontrado" });
            return;
        }

        const data = { ...req.body };
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;

        await prisma.movie.update({
            where: { id },
            data,
        });
    } catch (err) {
        res.status(500).send({
            message: "Falha ao atualizar ao atualizar o registro do filme",
            err,
        });
        return;
    }

    res.status(200).send();
});

app.delete(
    "/movies/:id",
    async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);

        try {
            const movie = await prisma.movie.findUnique({ where: { id } });

            if (!movie) {
                res.status(404).json({ message: "O filme não foi encontrado" });
                return;
            }

            await prisma.movie.delete({
                where: { id },
            });
        } catch (err) {
            res.status(500).json({
                message: "Não foi possivel remover o filme",
                err,
            });
        }

        res.status(200).send();
    }
);

app.get(
    "/movies/:genreName",
    async (req: Request, res: Response): Promise<void> => {
        try {
            const moviesFilteredByGenreName = await prisma.movie.findMany({
                include: {
                    genres: true,
                    languages: true,
                },
                where: {
                    genres: {
                        name: {
                            equals: req.params.genreName,
                            mode: "insensitive",
                        },
                    },
                },
            });

            res.status(200).json(moviesFilteredByGenreName);
        } catch (err) {
            res.status(500).json({
                message: "Falha ao filtrar os filmes por genero",
                err,
            });
        }
    }
);

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});
