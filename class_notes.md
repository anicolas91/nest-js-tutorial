# Course notes

## Intro

- Apparently nest js is really good at instance management, all you need to do is `constructor(private yourThing: YourThing)` the thing does it instead of having to manually instantiate.
- It's clean, you can do things such as the controller is clean, and is only busy with the logic of requests, and the service logic is constrained to connecting to the database and such (business logic).

## prisma

- you can use prisma to have the schema and the sql written for you, and to import things super nicely instead of hardcoding modules.
  useful commands are:

```bash
npx prisma --help

npx prisma migrate dev \\ this migrates things from prisma so you can access them on typescript, the db, etc

npx prisma generate \\ this generates artifacts

npx prisma studio \\ UI dashboard
```
