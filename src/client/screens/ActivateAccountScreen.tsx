/** @jsx jsx */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Box, Flex, Spinner, Card, Styled, jsx, Text } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";
import { ReactComponent as SuccessIllustration } from "../media/successfully-registered-illustration.svg";

import { activateAccount } from "../api";
import CenteredContent from "../components/CenteredContent";
import { Resource } from "../resource";

const ActivateAccountScreen = () => {
  const { token } = useParams();
  const [activationResource, setActivationResource] = useState<Resource<void>>({
    isPending: false
  });
  useEffect(() => {
    // Disabling 'functional/no-conditional-statement' without naming it.
    // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
    // eslint-disable-next-line
    if (token !== undefined) {
      setActivationResource({ isPending: true });
      activateAccount(token)
        .then(() => setActivationResource({ resource: void 0 }))
        .catch(errorMessage => setActivationResource({ errorMessage }));
    }
  }, [token]);
  return (
    <CenteredContent>
      {"resource" in activationResource ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Logo sx={{ width: "15rem", mx: "auto", mb: 4 }} />
          <Card
            sx={{
              variant: "card.floating",
              display: "flex",
              flexDirection: "column",
              justifyContent: "stretch"
            }}
          >
            <Box sx={{ mb: 3, mx: "auto" }}>
              <SuccessIllustration />
            </Box>
            <Text
              as="p"
              sx={{
                variant: "header.title",
                textAlign: "center",
                fontSize: 3,
                mb: 4
              }}
            >
              Thank you for activating your account!
            </Text>

            <Styled.a as={Link} to="/login" sx={{ variant: "linkButton" }}>
              Log in
            </Styled.a>
          </Card>
        </Box>
      ) : "errorMessage" in activationResource ? (
        <Box style={{ color: "red" }}>{activationResource.errorMessage}</Box>
      ) : "isPending" in activationResource && activationResource.isPending ? (
        <Flex sx={{ justifyContent: "center" }}>
          <Spinner variant="spinner.large" />
        </Flex>
      ) : null}
    </CenteredContent>
  );
};

export default ActivateAccountScreen;
