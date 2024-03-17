{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.05";
    systems.url = "github:nix-systems/default";
    devenv.url = "github:cachix/devenv";
  };

  nixConfig = {
    extra-trusted-public-keys = "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw=";
    extra-substituters = "https://devenv.cachix.org";
  };

  outputs = { self, nixpkgs, devenv, systems, ... } @ inputs:
    let
      forEachSystem = nixpkgs.lib.genAttrs (import systems);
    in
    {
      packages = forEachSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # (fixes apple sillicon "exec format error")
        pkgsLinux = if pkgs.system == "aarch64-darwin"
                    then nixpkgs.legacyPackages.aarch64-linux
                    else nixpkgs.legacyPackages.x86_64-linux;
      in
      {
        devenv-up = self.devShells.${system}.default.config.procfileScript;

        # for more details on how to use dockerTools,
        # see https://nixos.org/nixpkgs/manual/#sec-pkgs-dockerTools
        docker = pkgs.dockerTools.buildLayeredImage {
          name = "downup";
          tag = "latest";
          config = {
            # layered docker image from nix flake
            Cmd = [
              "${pkgsLinux.bash}/bin/bash"
              "-c"
              "${pkgsLinux.fortune}/bin/fortune | ${pkgsLinux.cowsay}/bin/cowsay"
            ];
          };
        };

      });

      devShells = forEachSystem
        (system:
          let
            pkgs = nixpkgs.legacyPackages.${system};
          in
          {
            default = devenv.lib.mkShell {
              inherit inputs pkgs;
              modules = [
                {
                  difftastic.enable = true;

                  # https://devenv.sh/reference/options/
                  packages = with pkgs; [
                    jq
                  ];

                  languages.javascript = {
                    enable = true;
                    package = pkgs.nodejs_18;
                    npm = {
                      enable = true;
                      install.enable = true;
                    };
                  };
                  enterShell = ''
                    [[ ! -d ./node_modules ]] && npm install
                    [[ ! -f ./vendor.mjs ]] && npm run build
                    echo "... "
                    echo "<$(cat package.json | jq .name) environment>"
                    echo "{ \"node\" : { \"required\": $(cat package.json |jq .engines.node), \"installed\": \"$(node --version)\" }, \"npm\" : { \"required\": $(cat package.json |jq .engines.npm), \"installed\":\"$(npm --version)\" } }" | jq .
                  '';
                }
              ];
            };
          });
    };
}
