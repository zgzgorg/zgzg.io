FROM ruby:3.3-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /site
COPY Gemfile ./
RUN bundle install
COPY _config.yml ./
COPY _data/ ./_data/
COPY _includes/ ./_includes/
COPY _layouts/ ./_layouts/
COPY _sass/ ./_sass/
COPY assets/ ./assets/
COPY collections/ ./collections/
COPY images/ ./images/
COPY pages/ ./pages/
RUN JEKYLL_ENV=production bundle exec jekyll build --trace

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /site/_site /srv
ENV PORT=8080
EXPOSE 8080
