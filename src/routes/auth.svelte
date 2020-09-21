<script context="module">
  export async function preload(page, session) {
    return {
      props: await (await this.fetch(session.apiUrl + "/users/count")).json(),
      apiUrl: session.apiUrl
    };
  }
</script>

<script>
  import { goto, stores } from "@sapper/app";
  import { postApi } from "../../utils/requests.js";
  import { setCookie } from "../../utils/cookies";

  export let apiUrl, props;
  let username, password, passwordRepeat,
      usernameError, passwordError, passwordRepeatError,
      signUpPromise = new Promise((resolve, reject) => resolve(null));
  const { page, session } = stores();
  const user = $session.user;

  $: if (username !== undefined) {
    if (username.length === 0) {
      usernameError = "Заполните это поле.";
    } else if (/[^0-9a-zA-Z#$*_]/.test(username)) {
      usernameError =
        "Логин может состоять только из английских букв, цифр и знаков" +
        " #, $, *, _.";
    } else {
      usernameError = "";
    }
  }

  $: if (password !== undefined) {
    if (password.length === 0) {
      passwordError = "Заполните это поле.";
    } else if (password.length < 8) {
      passwordError = "Пароль должен состоять как минимум из 8 символов.";
    } else {
      passwordError = "";
    }
  }

  $: if (passwordRepeat !== undefined) {
    if (password !== passwordRepeat) {
      passwordRepeatError = "Пароли не совпадают.";
    } else {
      passwordRepeatError = "";
    }
  }

  const isSignup = props.count === 0;

  const logout = () => goto("/logout");
  const redirect = () => goto($page.query.redirectTo || "/");

  const signup = () => {
    if (username && password && passwordRepeat) {
      if (!(usernameError || passwordError || passwordRepeatError)) {
        signUpPromise = new Promise((resolve, reject) => {
          postApi(apiUrl + "/users/signup", {
            username,
            password,
          }).then((res) => {
            if (res.ok) {
              res.json().then(
                (json) => resolve(json),
                (e) => reject(e)
              );
            } else {
              reject(res);
            }
          });
        });

        signUpPromise.then(
          (json) => {
            setCookie("jwt", json.jwt, {
              sameSite: "Strict",
              maxAge: 1296000,
            });

            session.update(oldSession => {
              oldSession.user = json.user;

              return oldSession;
            });

            goto('/');
          },
          (e) => {
            console.log(e);
          }
        );
      }
    } else {
      username = "";
      password = "";
      passwordRepeat = "";
    }
  };

  const signin = (e) => {};
</script>

<style lang="sass">
  @import "../styles/global"

  form,
  .already-registered
    width: 100%
    max-width: 35rem
    margin: 0 auto
    padding: 3rem 0
    text-align: right

  form
    h1
      color: $color_blue
      text-align: center

    .error
      text-align: center
      color: $color_error_red
      font-size: .8rem
      width: 85%
      margin: .75rem auto

    .await
      text-align: right
      color: $color_green
      width: 90%
      margin: .75rem 10% 0 0

    input
      display: block
      font-size: 1rem
      color: $color_green
      border-bottom: .1rem solid $color_green
      padding: .25rem .5rem
      font-family: defaultFont
      font-weight: 700

    .key-input
      width: 90%
      margin: .75rem auto
      text-align: center

      &::placeholder
        color: inherit
    
    .submit
      display: inline-block
      transition: color .3s ease, background .3s ease
      margin-right: 5%

      &.disabled
        opacity: .6

        &:hover
          cursor: not-allowed

      &:not(.disabled):hover
        color: $color_gray
        background: $color_green
        cursor: pointer

  .already-registered
    h1
      font-size: 4em

    h1,
    h2,
    p
      text-align: center
      color: $color_green
      margin: .5em 0
    
    button
      display: inline-block
      font-size: 1rem
      font-family: defaultFont
      border-width: .15rem
      border-style: solid
      margin: .5em
      padding: .25rem .5rem
      transition: color .3s ease, background-color .3s ease

      &:hover
        cursor: pointer

    .logout
      color: $color_error_red
      border-color: $color_error_red

      &:hover
        background-color: $color_error_red
        color: white

    .continue
      color: $color_blue
      border-color: $color_blue

      &:hover
        background-color: $color_blue
        color: white
</style>

<svelte:head>
  {#if isSignup}
    <title>Регистрация • moderngymnasium</title>
  {:else}
    <title>Вход • moderngymnasium</title>
  {/if}
</svelte:head>

{#if user.isAuthenticated}
  <div class="already-registered">
    <h1>Снова?</h1>
    <h2>Вы уже зарегистрированы.</h2>
    <p>Если вы хотите войти в другой аккаунт, сначала выйдите из текущего.</p>
    <button class="logout" on:click={logout}> Выйти </button>
    <button class="continue" on:click={redirect}> Продолжить </button>
  </div>
{:else}
  {#if isSignup}
    <form class="signup" on:submit|preventDefault={signup}>
      <h1>Регистрация</h1>
      <input
        class="key-input"
        autocomplete="username"
        placeholder="Логин"
        maxlength="32"
        bind:value={username} />
      {#if usernameError}
        <p class="error">{usernameError}</p>
      {/if}
      <input
        class="key-input"
        type="password"
        autocomplete="new-password"
        placeholder="Пароль"
        maxlength="128"
        bind:value={password} />
      {#if passwordError}
        <p class="error">{passwordError}</p>
      {/if}
      <input
        class="key-input"
        type="password"
        autocomplete="new-password"
        placeholder="Повтор пароля"
        maxlength="128"
        bind:value={passwordRepeat} />
      {#if passwordRepeatError}
        <p class="error">{passwordRepeatError}</p>
      {/if}
      {#await signUpPromise}
        <p class="await">Ждём ответа...</p>
      {:then resolveValue}
        {#if resolveValue === null}
          <input
            class="submit"
            class:disabled={usernameError || passwordError || passwordRepeatError}
            type="submit"
            value="Зарегистрироваться" />
        {:else}
          <p class="await">Перенаправляем...</p>
        {/if}
      {:catch}
        <p class="error">
          К сожалению, что-то пошло не так. Пожалуйста, перезагрузите страницу и
          попробуйте снова.
        </p>
      {/await}
    </form>
  {:else}
    <form class="signin" on:submit|preventDefault={signin} />
  {/if}
{/if}