# syntax=docker/dockerfile:1

FROM node:20-slim AS base

WORKDIR /usr/app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json pnpm-lock.yaml /temp/dev/
RUN cd /temp/dev && pnpm install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json pnpm-lock.yaml /temp/prod/
RUN cd /temp/prod && pnpm install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/app .

EXPOSE 3000
CMD [ "pnpm", "start" ]

