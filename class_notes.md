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

npx prisma generate \\ this generates artifacts and updates TS

npx prisma studio \\ UI dashboard
```

If you ever update the schema, freel free to do on VS code `> TypeScript: Restart TS Server`

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

## avoiding creation of several db entries for the same email

Everytime we send a request, we createa new id even if the email is the same. to fix that we do:

On the schema.prisma, under the user table, add `@unique`:

```typescript
email String @unique
```

### connecting between prisma models

For the bookmarks to get the association of what user they belong to, simply do a `@relation` decorator on hte bookmark model

```typescript
  userId Int
  user User @relation(fields: [userId],references: [id])
```

That way on the user model you just do:

```typescript
  bookmarks Bookmark[]
```

Don't forget to add the `@@map` at the end of each model

### addressing error from unique constraint

if we submit data with an email that we already had, we will get this error:

```bash
{
	"statusCode": 500,
	"message": "Internal server error"
}
```

And on the logs of the actual app, we get the message

```bash
const user = await this.prisma.user.create(
Unique constraint failed on the fields: (`email`)
```

Which means it found out the email is a duplicate, and so it's erroring out.

to fix, do a try/catch block, where you catch as such:

```typescript
} catch (error) {
      if (
        error instanceof
        PrismaClientKnownRequestError
      ) {
        // this is the error code for duplicates
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Credentials taken',
          );
        }
        throw error; // if ti was not p2002, just throw back the error
      }
    }
```

In this case we know that `P2002` is the error code for a duplicte value. So this works whenever someone sends a duplicate email.

## finding unique user data

For the sign in bit, the user gives a username and a password. The first thing is to try and find the user matching email. To do that you can use `findUnique`:

```typescript
const user = await this.prisma.user.findUnique();
```

Note that the variable used during filtering HAS TO BE a `@unique` field

## Automatically respawn db

We've so far manually respawn and migrate the prisma db... which is a chore. We can automate that inside a package.json.

We create under `scripts`:

```json
"prisma:dev:deploy": "prisma migrate deploy",
"db:dev:rm": "docker compose rm dev-db -s -f -v",
"db:dev:up": "docker compose up dev-db -d",
"db:dev:restart": "yarn db:dev:rm && yarn db:dev:up && sleep 1 && yarn prisma:dev:deploy",
```

which basically kills the docker container and restarts it again

Fun fact, `prisma migrate deploy` helps to apply migrations and not create a new one all the time.

## tracking the user (authentication and authorization)

two options to know who the user is, and figure out permissions

- sessions
- json web token

authentication: we identify the user
authorization: we allow/disallow user to do some stuff

## config modules

Instead of having hardcoded url variables with the postgres connection, we can instead use a config module.

simply do:

```bash
yarn add @nestjs/config
```

It is usually implemented on the root module. Or in a custom module and implement it there. Like a validation one or something.

So basically on the `app.module.ts` you just import:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({}),
    ...
  ],
  ...
```

Notice that you need `forRoot` as an input. Also, this config module actually works off the dotenv library.

The module uses a service, so you can import this service into somewhere else, like prisma.

In any class to import a dependency injection, you need an injectable decorator.

But you don't want to use prisma itself, instead you want a config module.

You use the config module to import the postgres url instead of hardcoding it.

You just do:

```typescript
config.get('DATABASE_URL');
```

As for exposing the prisma module at the app level, you cannot do the `@global` decorator, but you can do the `isGlobal: true`

## Authentication

Seems like we are going to use _passport_.

In general, the user gives a username + password, we give them back a jwt.

JWT gets passed with code, in other scenarios you get passed with every request via a session.

Some people argue that JWT is bad for authentication. But writer disagrees.

To install libraries you do

```bash
yarn add @nestjs/passport passport
yarn add @nestjs/jwt passport-jwt
yarn add -D @types/passport-jwt \\ this is a development dependency
```

and thats it.

- _jwt_ - it signs in the code tokens. It uses the json web tokens library
- _nest/passport_ - pours passport to the next js

Some of this goes into our code, some of it goes into some folder called `strategy`

When using JWT you will be using a refresh token, and those have other stuff like expiration date and such.

We imported it in `auth.module.ts` so we have to do the same on `auth.service.ts` like so:

auth module:

```typescript
imports: [JwtModule.register({})],
```

auth service:

```typescript
private jwt: JwtService
```

We then make a fucntion to convert user info into tokens called `signToken`

this function calls `signAsync` and it gets as input a payload and some options for decoding.

You call in your key via `.env` and `JWT_SECRET`

You then have to return a token now instead of a user on `signin`.

You want to return an object with the token string inside.

So now we have created an object with the token, and the user may want to get info about themselves, for that you need `strategy`

## Strategy

Strategy should extend the passport module and implement the jwt module... via `PassportStrategy` + the user bearer bit, optional expiration on/off, and the secret key

It's a folder because we are specifying is for validation, it is its own thing, but we can also add `@Injectable` decorators like on auth. This way we can get our .env secrets.

NOTE: somehow i had to add a 'validate' section but dont know why.

We have added `JwtStrategy` to the auth.module providers, and will be accessed if we have a valid strategy. This also means that we could use fb or google sign in stuff.

## Accessing via other controllers

So we have a valid token, but we have only our default signin/signup bits... lets create another controler module via

```bash
nest g controller user --no-spec
```

that creates a new `user.controller.ts` file.

Using the decorator `@Get` with nothing else will try to catch things at root, whereas `@Get('test')` will try to find stuff inside a test folder.

## guards

When you want to add logic on how to activate a controller, you use guards.

A guard is a fcn that stands in front of an endpoint, and allows/disallows that fcn to run.

The guards that are compatible with the controller are inside `@nestjs/passport`

`PassportStrategy` by default uses 'jwt' as the name of the strategy but you can name it whatever you want.

When you add the guards, you also need the auth header.

## validate

turns out the instructor had forgotten to add the 'validate' portion on the JwtStrategy.

Turns out, you can just add a 'validate' portion on the strategy, and put any validation you want to get the thing running

```typescript
validate(payload: any) {
    //   You can do here any validation you want
    console.log({ payload });
    // appends payload to the user request
    return payload;
  }
```

and that will return the payload, and also attach it to hte user info.

So, whatever value we pass on the `validate` function, gets appended to the user request object.

So when you pass all that data through validate, you can then just request this data via `@Req() req: Request`, which is both from nestjs and express:

```typescript
getMe(@Req() req: Request) {
    console.log(
      {
        user: req.user,
      }
    )
    return 'user info';
  }
```

If we do:

```typescript
validate(payload: any) {
    return 'hi'; //payload;
  }
```

Then 'hi' will be logged on the terminal, because we will attach whatever we validate to the request.

## getting user info from access token

We need to grab db so we need to call prisma, to get info from the access token, like user email etc.

Basically we add on the constructor:

```typescript
constructor(
    config: ConfigService,
    private prisma: PrismaService, //you add this new bit
  )
```

and the validate function now becomes:

```typescript
 async validate(payload: {
    sub: number;
    email: string;
  }) {
    // getting values
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });
    return payload;
  }
```

NOTE: if you return on validate `return null` you will get a 401 unauthorized error. So don't do that.

Don't forget to remove the hash when passing down the user info... on the 2025 nest js you need to handle null case + split:

```typescript
// Handle null case
if (!user) {
  throw new UnauthorizedException(
    'User not found',
  );
}

// split hash from the rest
const { hash, ...userWithoutHash } = user;

return userWithoutHash;
```

And you can also just directly return `req.user` on the controller:

```typescript
getMe(@Req() req: Request) {
    return req.user;
  }
```

So now when we go get info via:

```bash
http://localhost:3333/users/me

Authorization: Bearer xxxxxx
```

Now we get info back on the user:

```bash
{
	"id": 6,
	"createdAt": "2025-11-17T17:43:34.110Z",
	"updatedAt": "2025-11-17T17:43:34.110Z",
	"email": "margarito2@gmail.com",
	"firstName": null,
	"lastName": null
}
```

So now, we can sign in, sign up, and get information on the user!

## Enhancements

### Creating custom guard

So the `AuthGuard('jwt')` is using what is called a magic string, apparently that is very error prone, so it is recommended to abstract that bit into its own class. Meaning, we create a custom guard.

We start by creating a new folder under `src/auth/guard` and adding `index.ts` and `jwt.guard.ts` inside the folder.

you just create its own class as:

```typescript
import { AuthGuard } from '@nestjs/passport';

export class JwtGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
```

and import accordingly on the user controller.

### Creating a custom decorator

We are using right now the default decorators from imported libraries, however it may be cleaner to use a custom decorator for `getMe(@Req() req: Request)`.

We start by creating a new folder under `src/auth/decorator` and adding `index.ts` and `get-user.decorator.ts` inside the folder.

For syntax please refer to the nest js [documentation](https://docs.nestjs.com/custom-decorators)

we use the sample from the documentation:

```typescript
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest();
    return request.user;
  },
);
```

So now with the custom decortor you have:

```typescript
getMe(@GetUser() user: User) {
    return user;
  }
```

So with this you can edit this custom decorator in one place in case you need to add some extra details like, you want to use the decorator to return a specific dataset, like this:

```typescript
@GetUser('email') email: string
```

### Setting up custom Http status

So turns out most post request basically return a `201 created` note, which i guess happens because it works and then it creates the output data.

So for that, maybe you want to just return a specific http response and not just the default 201 one. So for that you can add via decorator the status you want to return, like so:

```typescript
@HttpCode(HttpStatus.OK)
@Post('signin')
```

So that way when you make a post request, you atually get `200 ok`. You can right-click on HttpStatus to see all the options available.

It is handy to use on `sign in` because we do not really create a new resource when signing in, and so the 201 response is misleading.

## Automated testing

In a realistic scenario, you are not jumping back and forth within insomnia and your app, instead, you automatically try some tests to check that your app is working and doing what you expect.

In testing you have:

- unit testing - tries out the functions, like sign up, but it takes a ton of time. They are a good investment if this is a long term project
- e2e testing - verifies the high level user journey in the app. User signs up, requests his profile, interacts with app, etc.
- integration testing - testing modules and bits together to see if they interact well. Is the same token working correctly? is the exception throw correct?

nest js is cools in that it already separates stuff by module/functionality.

So we can define what segments of my app to test together.

Testing takes the same amount of time as creating the app.

You can do:

- test driven development - you write your app as you test.
- e2e testing - it allows to showcase the use of our app and prove it works.

### default nest js tester

Nest js already made a suggested test under the `test` folder.

It ecommends `supertest` as the default library for e2e testing.

### Pactum as tester

In our case, we're going to use another library that the author recommended.

It is called pactum, you can find information on their [documentation](https://pactumjs.github.io/), and we install via:

```bash
yarn add -D pactum
```

### Getting started

We need to start with

- a custom testing database so we do not delete/create our actual data all the time
- the prisma service associated with this database for testing, it should be cleaned up every time.

We start by creating a testing module, in the style of the global module for the app shown in `app.module.ts`.

So to do that, we first edit our `app.e2e-spec.ts` to do some dummy test:

```typescript
describe('App e2e', () => {
  it.todo('should pass');
});
```

And then we have nest js running the test for us via (its already written by default in `package.json`):

```bash
"test:e2e": "jest --config ./test/jest-e2e.json"
```

So just run

```bash
yarn test:e2e
```

Now, we actually create a testing module in the form of:

```typescript
describe('App e2e', () => {
  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
  });
  it.todo('should pass');
});
```

Where we use moduleRef... which is jest, and the testing library from nest js. And we import the Main App Module in `app.module.ts` and compile and that's it.
