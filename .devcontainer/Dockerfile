FROM ubuntu:rolling

ENV USER=node \
    USER_UID=1000 \
    USER_GID=1000

RUN apt update && \
    apt install --no-install-recommends --yes bash bash-completion ca-certificates curl git gnupg2 lsb-release openssh-client sudo unzip vim zip && \
    rm -rf /var/lib/apt/lists/*
    
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - && \
    echo "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list && \
    apt update && \
    apt install --no-install-recommends --yes docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --gid ${USER_GID} ${USER} && \
    useradd --uid ${USER_UID} --gid ${USER} --shell /bin/bash --create-home ${USER} && \
    echo "${USER} ALL=(ALL) NOPASSWD:ALL" | tee "/etc/sudoers.d/${USER}"

USER ${USER}

RUN NVM_VERSION="$(curl -fsSL "https://api.github.com/repos/nvm-sh/nvm/releases/latest" | grep -Po '"tag_name": "v\K.*?(?=")')" && \
    curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh" | NODE_VERSION="--lts" bash && \
    curl -fsSL "https://starship.rs/install.sh" | bash -s -- --yes && \
    echo "eval \"\$(starship init bash)\"" | tee -a ~/.bashrc