terraform {
  backend "remote" {
    organization = "IDKUNO"

    workspaces {
      name = "open-wa-api-workspace"
    }
  }
}
