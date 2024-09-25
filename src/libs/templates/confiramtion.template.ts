export const confirmation = (name: string, href?: string) => {
  return `
    <h1>Здравствуйте, ${name}!</h1>
    <p>Для подтверждения почты перейдите по ссылке:</p>
    <hr />
    <a href="${href}">Подтвердить</a>
`;
};
