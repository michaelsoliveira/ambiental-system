import { CredentialsSignin } from "next-auth";

class InvalidCredentials extends CredentialsSignin {
	code = "invalid_credentials";
}

export { InvalidCredentials };