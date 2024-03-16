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
      packages = forEachSystem (system: {
        devenv-up = self.devShells.${system}.default.config.procfileScript;
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
