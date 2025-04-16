# FraserVotes 2024
A secure online voting platform for student council elections. This was used for John Fraser SS's SAC elections in 2024. The web app is intended to be used on a "kiosk" device in a voting station, substituting a regular ballot.

# Key Points
- PGP encryption for all ballots
- Local decryption of ballots, keeping your private key secure as it stays on your computer
- Fully mobile responsive
- Stack: React/Next.js, Typescript, Bun, MongoDB, GraphQL/Apollo Server, Firebase Authentication

# Photos

## Deployment on Election Day
![20240524_124153](https://github.com/user-attachments/assets/2124c343-542c-45c2-a83b-467bbc7a82a6)

## User Interface
![Check-in page for volunteers](https://github.com/user-attachments/assets/ad9f83bf-6236-4f5a-bdee-1bef131c231a)
Check-in page, which allows volunteers to open a ballot for a student voter using their own volunteer key (4 random words) and the voter's student number

<br />

![Ballot page for voters](https://github.com/user-attachments/assets/1ef0b8d9-076b-42a2-8215-9117ecea69d0)
*Ballot page, where students can input their choices for the next year's student council*

### Admin Pages
![Overview page for admins](https://github.com/user-attachments/assets/088ce7d5-acb3-4f29-a5d3-b845ad22ec29)
*Overview page, displaying how many people have voted, as well as a list for who has/hasn't voted (NOTE: ballots are not associated to student numbers, so there is no way of finding a voter's ballot)*

<br />

![Ballot count page for admins](https://github.com/user-attachments/assets/b000b124-7231-4fe2-b00d-ddeffbbf2c98)
*Ballot count page, where the counting process can be started for all ballots. This action can only be completed if voting is closed, and requires the voting administrator's private key. As mentioned before, the counting happens locally, and your private key does not leave your computer.*

<br />

![Settings page for admins](https://github.com/user-attachments/assets/2786ea5d-7710-4139-b0d9-21d6f14d10db)
*Settings page, where admins can start/stop voting, change the public key, and reset all data on the platform. Note that the last two actions can only be completed if voting is closed.*

# Copyright
This project is under the MIT License. More info is available in [LICENSE](LICENSE)
