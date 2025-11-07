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

- you can do `export class PrismaService extends PrismaClient` to have the thing connect to prisma client.

- adding to auth.module imports means that you can give access to that import and its contents into anything else auth related.

- you need to import on auth module, but also the user/bookmark needs access to the db, and other ones. Do you need to import every time? no, then make it `@Global` so that the service is available to all modules.

## decorators

- Anything with a `@` is a decorator, they sorta come from expres js... the one that you can use to make your own is `@Req`, which is the thing to call the express js bits.

- You can go even one more up and replace an entire thing with a decorator. For example, instead of doing:

```typescript
signup(@Req() req: Request) {
        console.log(req.body)
```

you can do

```typescript
signup(@Body() dto: any) {
    console.log({
      dto,
    });
```

where dto: data transfer object

The advantage of using decorators is that you can get the correct body, you dont have to worry about it.

However we don't know the shape of the answer... so for that you create a dto folder with your structure, called `auth.dto.ts` and `index.ts`

With `dto` you can set up the shape and you can just import the dto itself to say what shape and stuff is that one.

Dto allows you to switch to fastify and other such things.

### mini note:

The tutorial says that we should use:

```typescript
import { AuthDto } from './dto';
```

but it actually needs:

```typescript
import type { AuthDto } from './dto';
```

On the newer nest js things are stricter, you need to specify you are actually setting up a `type`... nest js is using es lint, so things are stricter now.

## validation

What happens when the email/password is empty? we need to use validators.

First, you can check the data type you got via:

```typescript
typeOfEmail: typeof email,
```

And you can also set up the type of valid value via:

```typescript
@Body('password', ParseIntPipe)
```

for example, in this case we want a number, if its a string it will throw an error:

```bash
{
	"message": "Validation failed (numeric string is expected)",
	"error": "Bad Request",
	"statusCode": 400
}
```

It will stop the execution of the code even if it gets to the log:

```typescript
  signup(
    @Body('email') email: string,
    @Body('password', ParseIntPipe) /// it will stop here
    password: string,
  ) {
    console.log({
      email,
      typeOfEmail: typeof email,
      password,
      typeOfPassword: typeof password,
    });

```

### Pipes

We get these built-in pipes (see nest JS documentation on [pipes](https://docs.nestjs.com/pipes)):

- ValidationPipe
- ParseIntPipe
- ParseFloatPipe
- ParseBoolPipe
- ParseArrayPipe
- FarseUUIDPipe
- ParseEnumPipe
- DefaultValuePipe

We also have something called `class-validator` and `class-transformer`. You can install them via:

```bash
yarn add class-validator class-transformer
```

With these libraries you can apply these validations/transformations to the dto like so:

```typescript
import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

Which is neat because its so very readable.

Remember to tell the app to use the validation pipes as global pipes, like so:

```typescript
app.useGlobalPipes(new ValidationPipe());
```

And to change the import of AuthDto to not specify it's a type, because now its a class:

```typescript
import { AuthDto } from './dto';
```

### funny injections

if someone is trying to chuck in more data than expected, that may not be ideal. So you can do:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

To make sure that whatever comes back is only the stuff youve set up. Like for example just the email and the password, nothing else.

## encryption

We are using argon2 because of reasons. It says that it is a better solution than decrypt because you can hash more that one stuff.

install via

```bash
yarn add argon2
```

And generate the hash via:

```typescript
const hash = argon.hash(dto.password);
```

## sending only select data to db

Turns out prisma can let you select from all the data you have, a selection of data you want to add to the db. For example, in this case you don't want the hash to be saved, so you do"

```typescript
const user = await this.prisma.user.create({
  data: {
    email: dto.email,
    hash,
  },
  select: {
    // this bit selects what to save on the db, skips the rest
    id: true,
    email: true,
    createdAt: true,
  },
});
```

However that's apparently a 'lot of logic to write', so people use transformers instead.
