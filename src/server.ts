import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

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

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});
