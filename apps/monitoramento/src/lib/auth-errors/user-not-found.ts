import { CredentialsSignin } from "next-auth";

class UserNotFound extends CredentialsSignin {
	code = "user_not_found";
}

export { UserNotFound };