-- Seed script to add 100 members and distribute them across departments
-- This script adds realistic Tanzanian names and distributes members evenly across departments

-- Insert 100 members with Tanzanian names and realistic data
INSERT INTO members (
  member_number, first_name, last_name, middle_name, gender, date_of_birth, 
  marital_status, phone, email, address, occupation, employer, 
  emergency_contact_name, emergency_contact_phone, baptism_date, membership_date, status
) VALUES
-- Members 1-10
('FCC001', 'John', 'Mwalimu', 'Peter', 'male', '1985-03-15', 'married', '+255789123456', 'john.mwalimu@gmail.com', 'Sinza, Dar es Salaam', 'Teacher', 'Government Secondary School', 'Mary Mwalimu', '+255789123457', '2020-01-15', '2019-12-01', 'active'),
('FCC002', 'Grace', 'Kimaro', 'Elizabeth', 'female', '1990-07-22', 'single', '+255756234567', 'grace.kimaro@yahoo.com', 'Mwenge, Dar es Salaam', 'Nurse', 'Muhimbili Hospital', 'David Kimaro', '+255756234568', '2021-03-20', '2021-02-14', 'active'),
('FCC003', 'Emmanuel', 'Mbwilo', 'Joseph', 'male', '1978-11-08', 'married', '+255765345678', 'emmanuel.mbwilo@outlook.com', 'Mikocheni, Dar es Salaam', 'Engineer', 'TANESCO', 'Sarah Mbwilo', '+255765345679', '2019-05-10', '2019-01-20', 'active'),
('FCC004', 'Esther', 'Ngowi', 'Rebecca', 'female', '1992-12-03', 'single', '+255784456789', 'esther.ngowi@gmail.com', 'Ubungo, Dar es Salaam', 'Accountant', 'NMB Bank', 'Ruth Ngowi', '+255784456790', '2022-07-15', '2022-06-05', 'active'),
('FCC005', 'Daniel', 'Mollel', 'Samuel', 'male', '1987-04-18', 'married', '+255773567890', 'daniel.mollel@hotmail.com', 'Kinondoni, Dar es Salaam', 'Doctor', 'Aga Khan Hospital', 'Joyce Mollel', '+255773567891', '2020-09-12', '2020-08-01', 'active'),
('FCC006', 'Miriam', 'Lwoga', 'Grace', 'female', '1995-06-30', 'single', '+255762678901', 'miriam.lwoga@gmail.com', 'Magomeni, Dar es Salaam', 'Student', 'University of Dar es Salaam', 'Paul Lwoga', '+255762678902', '2023-02-18', '2023-01-08', 'active'),
('FCC007', 'Moses', 'Kileo', 'David', 'male', '1983-09-14', 'married', '+255751789012', 'moses.kileo@yahoo.com', 'Temeke, Dar es Salaam', 'Businessman', 'Own Business', 'Hannah Kileo', '+255751789013', '2018-11-25', '2018-10-07', 'active'),
('FCC008', 'Ruth', 'Massawe', 'Joy', 'female', '1988-01-27', 'married', '+255740890123', 'ruth.massawe@outlook.com', 'Ilala, Dar es Salaam', 'Lawyer', 'High Court of Tanzania', 'Isaac Massawe', '+255740890124', '2019-08-30', '2019-07-15', 'active'),
('FCC009', 'Gabriel', 'Shayo', 'Michael', 'male', '1991-05-11', 'single', '+255729901234', 'gabriel.shayo@gmail.com', 'Kariakoo, Dar es Salaam', 'IT Specialist', 'Vodacom Tanzania', 'Leah Shayo', '+255729901235', '2021-12-05', '2021-11-20', 'active'),
('FCC010', 'Sarah', 'Mushi', 'Faith', 'female', '1986-08-19', 'married', '+255718012345', 'sarah.mushi@hotmail.com', 'Msimbazi, Dar es Salaam', 'Teacher', 'International School', 'Joshua Mushi', '+255718012346', '2020-04-22', '2020-03-10', 'active'),

-- Members 11-20
('FCC011', 'Peter', 'Lyimo', 'John', 'male', '1989-02-14', 'married', '+255707123456', 'peter.lyimo@gmail.com', 'Kigamboni, Dar es Salaam', 'Pilot', 'Air Tanzania', 'Anna Lyimo', '+255707123457', '2021-06-18', '2021-05-02', 'active'),
('FCC012', 'Mary', 'Kihiyo', 'Hope', 'female', '1993-10-25', 'single', '+255696234567', 'mary.kihiyo@yahoo.com', 'Mbezi, Dar es Salaam', 'Journalist', 'The Citizen Newspaper', 'Simon Kihiyo', '+255696234568', '2022-09-10', '2022-08-15', 'active'),
('FCC013', 'Samuel', 'Mwakasege', 'Paul', 'male', '1980-07-07', 'married', '+255685345678', 'samuel.mwakasege@outlook.com', 'Tegeta, Dar es Salaam', 'Police Officer', 'Tanzania Police Force', 'Deborah Mwakasege', '+255685345679', '2019-01-20', '2018-12-05', 'active'),
('FCC014', 'Joyce', 'Mwambapa', 'Love', 'female', '1994-12-12', 'single', '+255674456789', 'joyce.mwambapa@gmail.com', 'Goba, Dar es Salaam', 'Pharmacist', 'Muhimbili Pharmacy', 'Thomas Mwambapa', '+255674456790', '2023-04-08', '2023-03-22', 'active'),
('FCC015', 'David', 'Mrema', 'Israel', 'male', '1985-03-29', 'married', '+255663567890', 'david.mrema@hotmail.com', 'Mabibo, Dar es Salaam', 'Mechanic', 'Toyota Tanzania', 'Rachel Mrema', '+255663567891', '2020-07-14', '2020-06-01', 'active'),
('FCC016', 'Elizabeth', 'Mwaseba', 'Peace', 'female', '1991-11-16', 'single', '+255652678901', 'elizabeth.mwaseba@yahoo.com', 'Buguruni, Dar es Salaam', 'Social Worker', 'UNICEF Tanzania', 'Andrew Mwaseba', '+255652678902', '2022-01-30', '2022-01-02', 'active'),
('FCC017', 'Joseph', 'Mwenda', 'Emmanuel', 'male', '1987-06-23', 'married', '+255641789012', 'joseph.mwenda@gmail.com', 'Chang''ombe, Dar es Salaam', 'Electrician', 'TANESCO', 'Priscilla Mwenda', '+255641789013', '2019-10-15', '2019-09-08', 'active'),
('FCC018', 'Neema', 'Lugalla', 'Blessing', 'female', '1996-04-05', 'single', '+255630890123', 'neema.lugalla@outlook.com', 'Yombo Vituka, Dar es Salaam', 'Student', 'Ardhi University', 'Benjamin Lugalla', '+255630890124', '2023-08-12', '2023-07-25', 'active'),
('FCC019', 'Benjamin', 'Kilonzo', 'Caleb', 'male', '1982-01-31', 'married', '+255619901234', 'benjamin.kilonzo@hotmail.com', 'Vingunguti, Dar es Salaam', 'Chef', 'Hyatt Regency Hotel', 'Martha Kilonzo', '+255619901235', '2018-05-26', '2018-04-10', 'active'),
('FCC020', 'Deborah', 'Mwinyimkuu', 'Victory', 'female', '1990-09-08', 'married', '+255608012345', 'deborah.mwinyimkuu@gmail.com', 'Kinyerezi, Dar es Salaam', 'Banker', 'CRDB Bank', 'Philip Mwinyimkuu', '+255608012346', '2021-11-04', '2021-10-18', 'active'),

-- Members 21-30
('FCC021', 'Isaac', 'Mwanga', 'Joshua', 'male', '1984-12-20', 'married', '+255789234567', 'isaac.mwanga@yahoo.com', 'Mbagala, Dar es Salaam', 'Farmer', 'Own Farm', 'Helen Mwanga', '+255789234568', '2019-03-17', '2019-02-01', 'active'),
('FCC022', 'Rehema', 'Mwakinyala', 'Mercy', 'female', '1992-08-13', 'single', '+255756345678', 'rehema.mwakinyala@gmail.com', 'Kawe, Dar es Salaam', 'Architect', 'NHC', 'Jacob Mwakinyala', '+255756345679', '2022-12-03', '2022-11-12', 'active'),
('FCC023', 'Solomon', 'Mwampashi', 'Wisdom', 'male', '1986-05-26', 'married', '+255765456789', 'solomon.mwampashi@outlook.com', 'Tabata, Dar es Salaam', 'Surveyor', 'Ministry of Lands', 'Grace Mwampashi', '+255765456790', '2020-02-09', '2020-01-15', 'active'),
('FCC024', 'Agnes', 'Mwalimu', 'Faith', 'female', '1995-01-17', 'single', '+255784567890', 'agnes.mwalimu@hotmail.com', 'Kimara, Dar es Salaam', 'Graphic Designer', 'Creative Agency', 'Peter Mwalimu', '+255784567891', '2023-06-25', '2023-06-01', 'active'),
('FCC025', 'Baraka', 'Mwakaje', 'Blessing', 'male', '1988-10-04', 'married', '+255773678901', 'baraka.mwakaje@gmail.com', 'Mlimani, Dar es Salaam', 'Security Guard', 'Group Four Security', 'Stella Mwakaje', '+255773678902', '2021-01-16', '2020-12-20', 'active'),
('FCC026', 'Consolata', 'Mwakitwange', 'Comfort', 'female', '1989-07-12', 'married', '+255762789012', 'consolata.mwakitwange@yahoo.com', 'Kunduchi, Dar es Salaam', 'Midwife', 'Temeke Hospital', 'Francis Mwakitwange', '+255762789013', '2020-12-07', '2020-11-01', 'active'),
('FCC027', 'Timothy', 'Mwakalobo', 'Gift', 'male', '1983-04-21', 'married', '+255751890123', 'timothy.mwakalobo@outlook.com', 'Mikumi, Dar es Salaam', 'Driver', 'Daladalas Association', 'Prisca Mwakalobo', '+255751890124', '2018-08-19', '2018-07-05', 'active'),
('FCC028', 'Leah', 'Mwakabana', 'Joy', 'female', '1994-11-28', 'single', '+255740901234', 'leah.mwakabana@gmail.com', 'Mzimuni, Dar es Salaam', 'Hair Stylist', 'Own Salon', 'Moses Mwakabana', '+255740901235', '2023-02-14', '2023-01-28', 'active'),
('FCC029', 'Elijah', 'Mwakasungula', 'Hope', 'male', '1987-02-06', 'married', '+255729012345', 'elijah.mwakasungula@hotmail.com', 'Kijitonyama, Dar es Salaam', 'Plumber', 'DAWASCO', 'Ruth Mwakasungula', '+255729012346', '2019-09-22', '2019-08-10', 'active'),
('FCC030', 'Anna', 'Mwakibete', 'Grace', 'female', '1991-06-15', 'single', '+255718123456', 'anna.mwakibete@yahoo.com', 'Msasani, Dar es Salaam', 'Receptionist', 'Hotel Sea Cliff', 'Daniel Mwakibete', '+255718123457', '2022-04-10', '2022-03-15', 'active'),

-- Members 31-40
('FCC031', 'Caleb', 'Mwakisyala', 'Faith', 'male', '1985-09-18', 'married', '+255707234567', 'caleb.mwakisyala@gmail.com', 'Upanga, Dar es Salaam', 'Tailor', 'Own Shop', 'Esther Mwakisyala', '+255707234568', '2020-06-28', '2020-05-12', 'active'),
('FCC032', 'Pendo', 'Mwakambo', 'Love', 'female', '1993-03-03', 'single', '+255696345678', 'pendo.mwakambo@outlook.com', 'Magomeni Mapipa, Dar es Salaam', 'Cashier', 'Shoprite', 'John Mwakambo', '+255696345679', '2022-11-20', '2022-10-30', 'active'),
('FCC033', 'Jeremiah', 'Mwakabonga', 'Praise', 'male', '1989-12-25', 'married', '+255685456789', 'jeremiah.mwakabonga@hotmail.com', 'Posta, Dar es Salaam', 'Postman', 'Tanzania Posts Corporation', 'Mary Mwakabonga', '+255685456790', '2021-05-08', '2021-04-20', 'active'),
('FCC034', 'Hawa', 'Mwakanyamale', 'Peace', 'female', '1996-07-09', 'single', '+255674567890', 'hawa.mwakanyamale@gmail.com', 'Gerezani, Dar es Salaam', 'Student', 'Muhimbili University', 'Rashid Mwakanyamale', '+255674567891', '2023-09-03', '2023-08-18', 'active'),
('FCC035', 'Noah', 'Mwakionda', 'Faithful', 'male', '1981-01-14', 'married', '+255663678901', 'noah.mwakionda@yahoo.com', 'Machinjioni, Dar es Salaam', 'Fisherman', 'Fishing Cooperative', 'Sarah Mwakionda', '+255663678902', '2018-02-11', '2017-12-25', 'active'),
('FCC036', 'Zuhura', 'Mwakajoka', 'Mercy', 'female', '1990-10-22', 'married', '+255652789012', 'zuhura.mwakajoka@outlook.com', 'Mtoni, Dar es Salaam', 'Cook', 'Restaurant', 'Ali Mwakajoka', '+255652789013', '2021-08-14', '2021-07-28', 'active'),
('FCC037', 'Jonah', 'Mwakipesile', 'Victory', 'male', '1986-05-07', 'married', '+255641890123', 'jonah.mwakipesile@gmail.com', 'Mnazi Mmoja, Dar es Salaam', 'Carpenter', 'Construction Company', 'Rebecca Mwakipesile', '+255641890124', '2019-12-01', '2019-11-10', 'active'),
('FCC038', 'Mwanaidi', 'Mwakalinga', 'Hope', 'female', '1994-02-28', 'single', '+255630901234', 'mwanaidi.mwakalinga@hotmail.com', 'Msimbazi Valley, Dar es Salaam', 'Secretary', 'Government Office', 'Hassan Mwakalinga', '+255630901235', '2023-01-21', '2022-12-30', 'active'),
('FCC039', 'Levi', 'Mwakalyelye', 'Strength', 'male', '1987-11-11', 'married', '+255619012345', 'levi.mwakalyelye@yahoo.com', 'Mbezi Beach, Dar es Salaam', 'Fishmonger', 'Fish Market', 'Joyce Mwakalyelye', '+255619012346', '2020-09-06', '2020-08-18', 'active'),
('FCC040', 'Amina', 'Mwakanjuki', 'Blessing', 'female', '1992-08-16', 'single', '+255608123456', 'amina.mwakanjuki@gmail.com', 'Segerea, Dar es Salaam', 'Seamstress', 'Textile Factory', 'Omar Mwakanjuki', '+255608123457', '2022-07-02', '2022-06-15', 'active'),

-- Members 41-50
('FCC041', 'Meshack', 'Mwakalukwa', 'Promise', 'male', '1984-04-24', 'married', '+255789345678', 'meshack.mwakalukwa@outlook.com', 'Kiwalani, Dar es Salaam', 'Welder', 'Welding Workshop', 'Grace Mwakalukwa', '+255789345679', '2018-10-14', '2018-09-25', 'active'),
('FCC042', 'Fatuma', 'Mwakalebela', 'Goodness', 'female', '1991-01-19', 'married', '+255756456789', 'fatuma.mwakalebela@hotmail.com', 'Kivukoni, Dar es Salaam', 'Cleaner', 'Office Building', 'Juma Mwakalebela', '+255756456790', '2021-04-25', '2021-04-05', 'active'),
('FCC043', 'Gideon', 'Mwakapinga', 'Wisdom', 'male', '1988-07-30', 'married', '+255765567890', 'gideon.mwakapinga@gmail.com', 'Mchafukoge, Dar es Salaam', 'Boda Boda Rider', 'Transport Association', 'Esther Mwakapinga', '+255765567891', '2020-11-08', '2020-10-22', 'active'),
('FCC044', 'Halima', 'Mwakalindile', 'Faithful', 'female', '1995-12-13', 'single', '+255784678901', 'halima.mwakalindile@yahoo.com', 'Mbagala Rangi Tatu, Dar es Salaam', 'Shop Attendant', 'Supermarket', 'Bakari Mwakalindile', '+255784678902', '2023-03-19', '2023-03-01', 'active'),
('FCC045', 'Ezra', 'Mwakanyelele', 'Strength', 'male', '1983-06-06', 'married', '+255773789012', 'ezra.mwakanyelele@outlook.com', 'Chamazi, Dar es Salaam', 'Mason', 'Construction', 'Ruth Mwakanyelele', '+255773789013', '2018-12-23', '2018-11-30', 'active'),
('FCC046', 'Zaituni', 'Mwakalunde', 'Peace', 'female', '1990-03-21', 'married', '+255762890123', 'zaituni.mwakalunde@gmail.com', 'Keko, Dar es Salaam', 'House Help', 'Private Family', 'Hamisi Mwakalunde', '+255762890124', '2021-07-11', '2021-06-25', 'active'),
('FCC047', 'Nehemiah', 'Mwakatobe', 'Grace', 'male', '1986-10-02', 'married', '+255751901234', 'nehemiah.mwakatobe@hotmail.com', 'Kibangu, Dar es Salaam', 'Painter', 'Painting Company', 'Mary Mwakatobe', '+255751901235', '2019-05-18', '2019-04-30', 'active'),
('FCC048', 'Mariam', 'Mwakatundu', 'Joy', 'female', '1994-09-17', 'single', '+255740012345', 'mariam.mwakatundu@yahoo.com', 'Ukonga, Dar es Salaam', 'Hairdresser', 'Beauty Salon', 'Ibrahim Mwakatundu', '+255740012346', '2022-12-25', '2022-12-10', 'active'),
('FCC049', 'Hosea', 'Mwakalima', 'Faithful', 'male', '1987-04-12', 'married', '+255729123456', 'hosea.mwakalima@gmail.com', 'Mbezi Juu, Dar es Salaam', 'Watchman', 'Security Company', 'Agnes Mwakalima', '+255729123457', '2020-01-26', '2020-01-05', 'active'),
('FCC050', 'Saida', 'Mwakatumbula', 'Hope', 'female', '1993-11-05', 'single', '+255718234567', 'saida.mwakatumbula@outlook.com', 'Vingunguti, Dar es Salaam', 'Nurse Aid', 'Health Center', 'Musa Mwakatumbula', '+255718234568', '2022-08-21', '2022-08-01', 'active'),

-- Members 51-60
('FCC051', 'Micah', 'Mwakalonge', 'Victory', 'male', '1985-12-08', 'married', '+255707345678', 'micah.mwakalonge@hotmail.com', 'Mabwepande, Dar es Salaam', 'Barber', 'Barbershop', 'Sarah Mwakalonge', '+255707345679', '2019-02-17', '2019-01-20', 'active'),
('FCC052', 'Rukia', 'Mwakatage', 'Blessing', 'female', '1991-06-21', 'married', '+255696456789', 'rukia.mwakatage@gmail.com', 'Ilala Boma, Dar es Salaam', 'Vendor', 'Market', 'Ally Mwakatage', '+255696456790', '2021-10-03', '2021-09-15', 'active'),
('FCC053', 'Habakkuk', 'Mwakanosya', 'Grace', 'male', '1989-01-24', 'married', '+255685567890', 'habakkuk.mwakanosya@yahoo.com', 'Kigogo, Dar es Salaam', 'Electrician', 'Electrical Shop', 'Esther Mwakanosya', '+255685567891', '2020-08-09', '2020-07-20', 'active'),
('FCC054', 'Khadija', 'Mwakatumbuka', 'Peace', 'female', '1996-04-18', 'single', '+255674678901', 'khadija.mwakatumbuka@outlook.com', 'Sinza Mori, Dar es Salaam', 'Student', 'College', 'Salim Mwakatumbuka', '+255674678902', '2023-05-07', '2023-04-22', 'active'),
('FCC055', 'Zephaniah', 'Mwakanyongo', 'Faithful', 'male', '1982-08-27', 'married', '+255663789012', 'zephaniah.mwakanyongo@gmail.com', 'Mbagala Zakhem, Dar es Salaam', 'Mechanic', 'Garage', 'Ruth Mwakanyongo', '+255663789013', '2018-06-10', '2018-05-15', 'active'),
('FCC056', 'Nasra', 'Mwakatobe', 'Joy', 'female', '1990-11-14', 'married', '+255652890123', 'nasra.mwakatobe@hotmail.com', 'Tandika, Dar es Salaam', 'Tailor', 'Tailoring Shop', 'Hamza Mwakatobe', '+255652890124', '2021-03-28', '2021-03-10', 'active'),
('FCC057', 'Haggai', 'Mwakalebwa', 'Strength', 'male', '1986-02-09', 'married', '+255641901234', 'haggai.mwakalebwa@yahoo.com', 'Kimanga, Dar es Salaam', 'Carpenter', 'Furniture Shop', 'Mary Mwakalebwa', '+255641901235', '2019-07-21', '2019-07-01', 'active'),
('FCC058', 'Mwajuma', 'Mwakatumbila', 'Hope', 'female', '1994-05-16', 'single', '+255630012345', 'mwajuma.mwakatumbila@gmail.com', 'Mnyamani, Dar es Salaam', 'Cashier', 'Shop', 'Juma Mwakatumbila', '+255630012346', '2022-09-25', '2022-09-05', 'active'),
('FCC059', 'Malachi', 'Mwakalwelo', 'Blessing', 'male', '1988-12-01', 'married', '+255619123456', 'malachi.mwakalwelo@outlook.com', 'Chanika, Dar es Salaam', 'Driver', 'Taxi', 'Grace Mwakalwelo', '+255619123457', '2020-04-05', '2020-03-18', 'active'),
('FCC060', 'Asha', 'Mwakatundu', 'Mercy', 'female', '1992-09-10', 'single', '+255608234567', 'asha.mwakatundu@hotmail.com', 'Mtongani, Dar es Salaam', 'Cleaner', 'Hospital', 'Hassan Mwakatundu', '+255608234568', '2022-02-14', '2022-01-28', 'active'),

-- Members 61-70
('FCC061', 'Zechariah', 'Mwakanoge', 'Victory', 'male', '1984-07-23', 'married', '+255789456789', 'zechariah.mwakanoge@gmail.com', 'Bunju, Dar es Salaam', 'Plumber', 'Plumbing Service', 'Rehema Mwakanoge', '+255789456790', '2018-09-02', '2018-08-10', 'active'),
('FCC062', 'Subira', 'Mwakatuma', 'Patience', 'female', '1991-03-06', 'married', '+255756567890', 'subira.mwakatuma@yahoo.com', 'Mbweni, Dar es Salaam', 'Shopkeeper', 'Small Shop', 'Omar Mwakatuma', '+255756567891', '2021-06-13', '2021-05-25', 'active'),
('FCC063', 'Joel', 'Mwakalinga', 'Grace', 'male', '1987-10-15', 'married', '+255765678901', 'joel.mwakalinga@outlook.com', 'Wazo, Dar es Salaam', 'Security Guard', 'Bank', 'Esther Mwakalinga', '+255765678902', '2019-11-24', '2019-11-01', 'active'),
('FCC064', 'Waridi', 'Mwakatumbuka', 'Rose', 'female', '1995-01-02', 'single', '+255784789012', 'waridi.mwakatumbuka@gmail.com', 'Magomeni Shalina, Dar es Salaam', 'Receptionist', 'Clinic', 'Ramadhani Mwakatumbuka', '+255784789013', '2023-04-16', '2023-04-01', 'active'),
('FCC065', 'Amos', 'Mwakanosya', 'Faithful', 'male', '1983-05-20', 'married', '+255773890123', 'amos.mwakanosya@hotmail.com', 'Boko, Dar es Salaam', 'Farmer', 'Agriculture', 'Ruth Mwakanosya', '+255773890124', '2018-03-18', '2018-02-28', 'active'),
('FCC066', 'Latifa', 'Mwakatobe', 'Gentle', 'female', '1989-08-11', 'married', '+255762901234', 'latifa.mwakatobe@yahoo.com', 'Kitunda, Dar es Salaam', 'House Wife', 'Home', 'Seif Mwakatobe', '+255762901235', '2020-10-25', '2020-10-01', 'active'),
('FCC067', 'Obadiah', 'Mwakalema', 'Servant', 'male', '1986-12-28', 'married', '+255751012345', 'obadiah.mwakalema@gmail.com', 'Mabibo Hostel, Dar es Salaam', 'Mechanic', 'Workshop', 'Mary Mwakalema', '+255751012346', '2019-04-07', '2019-03-15', 'active'),
('FCC068', 'Tumaini', 'Mwakatumbile', 'Hope', 'female', '1994-11-03', 'single', '+255740123456', 'tumaini.mwakatumbile@outlook.com', 'Yombo Dovya, Dar es Salaam', 'Teacher', 'Primary School', 'Mwalimu Mwakatumbile', '+255740123457', '2022-11-27', '2022-11-08', 'active'),
('FCC069', 'Jonah', 'Mwakalolo', 'Patience', 'male', '1988-06-25', 'married', '+255729234567', 'jonah.mwakalolo@hotmail.com', 'Mbagala Kuu, Dar es Salaam', 'Fisherman', 'Fishing', 'Agnes Mwakalolo', '+255729234568', '2020-05-17', '2020-04-30', 'active'),
('FCC070', 'Upendo', 'Mwakatungu', 'Love', 'female', '1993-04-14', 'single', '+255718345678', 'upendo.mwakatungu@gmail.com', 'Msongola, Dar es Salaam', 'Nurse', 'Dispensary', 'Paulo Mwakatungu', '+255718345679', '2022-06-19', '2022-06-01', 'active'),

-- Members 71-80
('FCC071', 'Habakkuk', 'Mwakalamba', 'Grace', 'male', '1985-02-17', 'married', '+255707456789', 'habakkuk.mwakalamba@yahoo.com', 'Mbezi Luis, Dar es Salaam', 'Watchman', 'Office Building', 'Sarah Mwakalamba', '+255707456790', '2019-01-13', '2018-12-20', 'active'),
('FCC072', 'Zawadi', 'Mwakatumbuka', 'Gift', 'female', '1990-09-22', 'married', '+255696567890', 'zawadi.mwakatumbuka@outlook.com', 'Makongo, Dar es Salaam', 'Seamstress', 'Sewing Shop', 'Ali Mwakatumbuka', '+255696567891', '2021-02-07', '2021-01-18', 'active'),
('FCC073', 'Micah', 'Mwakalole', 'Humble', 'male', '1987-07-04', 'married', '+255685678901', 'micah.mwakalole@gmail.com', 'Kimbo, Dar es Salaam', 'Painter', 'Painting', 'Esther Mwakalole', '+255685678902', '2019-08-25', '2019-08-01', 'active'),
('FCC074', 'Huruma', 'Mwakatumbula', 'Compassion', 'female', '1996-12-31', 'single', '+255674789012', 'huruma.mwakatumbula@hotmail.com', 'Kibamba, Dar es Salaam', 'Student', 'University', 'Mwalimu Mwakatumbula', '+255674789013', '2023-07-23', '2023-07-01', 'active'),
('FCC075', 'Nahum', 'Mwakandalama', 'Comfort', 'male', '1982-04-08', 'married', '+255663890123', 'nahum.mwakandalama@yahoo.com', 'Mbagala Shekilango, Dar es Salaam', 'Carpenter', 'Carpentry', 'Ruth Mwakandalama', '+255663890124', '2018-05-06', '2018-04-18', 'active'),
('FCC076', 'Baraka', 'Mwakatobe', 'Blessing', 'female', '1989-11-26', 'married', '+255652012345', 'baraka.mwakatobe@gmail.com', 'Kisutu, Dar es Salaam', 'Cook', 'Restaurant', 'Hamisi Mwakatobe', '+255652012346', '2020-12-20', '2020-12-01', 'active'),
('FCC077', 'Habakkuk', 'Mwakalanga', 'Faith', 'male', '1986-01-13', 'married', '+255641012345', 'habakkuk.mwakalanga@outlook.com', 'Kilakala, Dar es Salaam', 'Mechanic', 'Garage', 'Mary Mwakalanga', '+255641012346', '2019-03-10', '2019-02-20', 'active'),
('FCC078', 'Amani', 'Mwakatumbuka', 'Peace', 'female', '1994-06-29', 'single', '+255630123456', 'amani.mwakatumbuka@hotmail.com', 'Mwananyamala, Dar es Salaam', 'Hairdresser', 'Salon', 'Juma Mwakatumbuka', '+255630123457', '2022-10-08', '2022-09-20', 'active'),
('FCC079', 'Zephaniah', 'Mwakalole', 'Hidden', 'male', '1988-03-18', 'married', '+255619234567', 'zephaniah.mwakalole@gmail.com', 'Kisarawe, Dar es Salaam', 'Farmer', 'Farm', 'Grace Mwakalole', '+255619234568', '2020-07-26', '2020-07-05', 'active'),
('FCC080', 'Neema', 'Mwakatundu', 'Grace', 'female', '1993-10-07', 'single', '+255608345678', 'neema.mwakatundu@yahoo.com', 'Mbezi Beach, Dar es Salaam', 'Clerk', 'Government Office', 'Hassan Mwakatundu', '+255608345679', '2022-05-22', '2022-05-01', 'active'),

-- Members 81-90
('FCC081', 'Malachi', 'Mwakalindile', 'Messenger', 'male', '1984-11-12', 'married', '+255789567890', 'malachi.mwakalindile@outlook.com', 'Mburahati, Dar es Salaam', 'Postman', 'Post Office', 'Rehema Mwakalindile', '+255789567891', '2018-12-09', '2018-11-15', 'active'),
('FCC082', 'Furaha', 'Mwakatoba', 'Joy', 'female', '1991-05-25', 'married', '+255756678901', 'furaha.mwakatoba@gmail.com', 'Morocco, Dar es Salaam', 'Vendor', 'Market', 'Omar Mwakatoba', '+255756678902', '2021-09-12', '2021-08-25', 'active'),
('FCC083', 'Haggai', 'Mwakalole', 'Festive', 'male', '1987-08-30', 'married', '+255765789012', 'haggai.mwakalole@hotmail.com', 'Makumbusho, Dar es Salaam', 'Security Guard', 'Museum', 'Esther Mwakalole', '+255765789013', '2019-10-06', '2019-09-18', 'active'),
('FCC084', 'Imani', 'Mwakatumbuka', 'Faith', 'female', '1995-02-19', 'single', '+255784890123', 'imani.mwakatumbuka@yahoo.com', 'Buguruni Malapa, Dar es Salaam', 'Secretary', 'Office', 'Ramadhani Mwakatumbuka', '+255784890124', '2023-01-08', '2022-12-18', 'active'),
('FCC085', 'Zephaniah', 'Mwakandalichina', 'Hope', 'male', '1983-07-14', 'married', '+255773901234', 'zephaniah.mwakandalichina@gmail.com', 'Kimara Baruti, Dar es Salaam', 'Driver', 'Transport', 'Ruth Mwakandalichina', '+255773901235', '2018-08-26', '2018-08-01', 'active'),
('FCC086', 'Rehema', 'Mwakatobe', 'Mercy', 'female', '1989-12-09', 'married', '+255762012345', 'rehema.mwakatobe@outlook.com', 'Ubungo Plaza, Dar es Salaam', 'Cleaner', 'Shopping Mall', 'Seif Mwakatobe', '+255762012346', '2020-11-15', '2020-10-28', 'active'),
('FCC087', 'Obadiah', 'Mwakalanga', 'Servant', 'male', '1986-04-26', 'married', '+255751123456', 'obadiah.mwakalanga@hotmail.com', 'Kinondoni Shomvi, Dar es Salaam', 'Electrician', 'Electrical Work', 'Mary Mwakalanga', '+255751123457', '2019-06-02', '2019-05-10', 'active'),
('FCC088', 'Sikujua', 'Mwakatumbule', 'Unknown', 'female', '1994-09-15', 'single', '+255740234567', 'sikujua.mwakatumbule@gmail.com', 'Mwenge Coca Cola, Dar es Salaam', 'Shop Attendant', 'Shop', 'Mwalimu Mwakatumbule', '+255740234568', '2022-08-13', '2022-07-30', 'active'),
('FCC089', 'Joel', 'Mwakalolo', 'Lord is God', 'male', '1988-01-21', 'married', '+255729345678', 'joel.mwakalolo@yahoo.com', 'Kimara Temboni, Dar es Salaam', 'Mechanic', 'Workshop', 'Agnes Mwakalolo', '+255729345679', '2020-03-14', '2020-02-25', 'active'),
('FCC090', 'Heri', 'Mwakatundu', 'Blessing', 'female', '1993-06-08', 'single', '+255718456789', 'heri.mwakatundu@outlook.com', 'Kimisagara, Dar es Salaam', 'Nurse', 'Hospital', 'Paulo Mwakatundu', '+255718456790', '2022-04-17', '2022-04-01', 'active'),

-- Members 91-100
('FCC091', 'Micah', 'Mwakalindile', 'Who is like God', 'male', '1985-10-11', 'married', '+255707567890', 'micah.mwakalindile@hotmail.com', 'Kinondoni Mpakani, Dar es Salaam', 'Tailor', 'Tailoring', 'Sarah Mwakalindile', '+255707567891', '2019-02-24', '2019-02-01', 'active'),
('FCC092', 'Tumaini', 'Mwakatoba', 'Hope', 'female', '1990-07-28', 'married', '+255696678901', 'tumaini.mwakatoba@gmail.com', 'Manzese Urafiki, Dar es Salaam', 'House Help', 'Private Home', 'Ali Mwakatoba', '+255696678902', '2021-01-24', '2021-01-05', 'active'),
('FCC093', 'Nahum', 'Mwakalole', 'Comforter', 'male', '1987-12-17', 'married', '+255685789012', 'nahum.mwakalole@yahoo.com', 'Sinza Mori B, Dar es Salaam', 'Carpenter', 'Furniture', 'Esther Mwakalole', '+255685789013', '2019-12-08', '2019-11-20', 'active'),
('FCC094', 'Shukrani', 'Mwakatumbuka', 'Gratitude', 'female', '1996-03-04', 'single', '+255674890123', 'shukrani.mwakatumbuka@outlook.com', 'Msimbazi Kati, Dar es Salaam', 'Student', 'Technical College', 'Juma Mwakatumbuka', '+255674890124', '2023-06-11', '2023-05-28', 'active'),
('FCC095', 'Zephaniah', 'Mwakandalama', 'Hidden by God', 'male', '1982-01-07', 'married', '+255663901234', 'zephaniah.mwakandalama@gmail.com', 'Tabata Kimanga, Dar es Salaam', 'Security Guard', 'Factory', 'Ruth Mwakandalama', '+255663901235', '2018-04-15', '2018-03-28', 'active'),
('FCC096', 'Upendo', 'Mwakatobe', 'Love', 'female', '1989-06-13', 'married', '+255652123456', 'upendo.mwakatobe@hotmail.com', 'Magomeni Mapipa B, Dar es Salaam', 'Cook', 'Hotel', 'Hamisi Mwakatobe', '+255652123457', '2020-09-27', '2020-09-01', 'active'),
('FCC097', 'Malachi', 'Mwakalanga', 'My Angel', 'male', '1986-11-19', 'married', '+255641123456', 'malachi.mwakalanga@yahoo.com', 'Kigogo Kati, Dar es Salaam', 'Plumber', 'Plumbing Service', 'Mary Mwakalanga', '+255641123457', '2019-01-27', '2018-12-30', 'active'),
('FCC098', 'Amina', 'Mwakatumbule', 'Trustworthy', 'female', '1994-08-02', 'single', '+255630234567', 'amina.mwakatumbule@gmail.com', 'Mwananyamala Kisiwani, Dar es Salaam', 'Receptionist', 'Hotel', 'Hassan Mwakatumbule', '+255630234568', '2022-12-04', '2022-11-15', 'active'),
('FCC099', 'Obadiah', 'Mwakalolo', 'Servant of God', 'male', '1988-05-24', 'married', '+255619345678', 'obadiah.mwakalolo@outlook.com', 'Kinondoni Mtongani, Dar es Salaam', 'Fisherman', 'Fishing Boat', 'Grace Mwakalolo', '+255619345679', '2020-06-21', '2020-06-01', 'active'),
('FCC100', 'Baraka', 'Mwakatundu', 'Blessing', 'female', '1993-03-12', 'single', '+255608456789', 'baraka.mwakatundu@hotmail.com', 'Mbezi Juu Mpakani, Dar es Salaam', 'Teacher', 'Primary School', 'Omar Mwakatundu', '+255608456790', '2022-03-06', '2022-02-18', 'active');

-- Now distribute members across departments
-- Get department IDs first (assuming they already exist from the schema)

-- Youth Department (Members aged 15-35) - 20 members
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Youth Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'chairperson'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 2 THEN 'secretary'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 3 THEN 'treasurer'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '30 days'
FROM members m 
WHERE m.member_number IN ('FCC001', 'FCC002', 'FCC004', 'FCC006', 'FCC009', 'FCC012', 'FCC014', 'FCC016', 'FCC018', 'FCC022', 'FCC024', 'FCC028', 'FCC030', 'FCC032', 'FCC034', 'FCC038', 'FCC040', 'FCC044', 'FCC048', 'FCC050');

-- Women's Department - 25 members (all female members)
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Women''s Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'chairperson'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 2 THEN 'secretary'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 3 THEN 'treasurer'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '45 days'
FROM members m 
WHERE m.gender = 'female' AND m.member_number IN ('FCC002', 'FCC004', 'FCC006', 'FCC008', 'FCC010', 'FCC012', 'FCC014', 'FCC016', 'FCC018', 'FCC020', 'FCC022', 'FCC024', 'FCC026', 'FCC028', 'FCC030', 'FCC032', 'FCC034', 'FCC036', 'FCC038', 'FCC040', 'FCC042', 'FCC044', 'FCC046', 'FCC048', 'FCC050');

-- Men's Department - 25 members (all male members)
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Men''s Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'chairperson'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 2 THEN 'secretary'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 3 THEN 'treasurer'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '60 days'
FROM members m 
WHERE m.gender = 'male' AND m.member_number IN ('FCC001', 'FCC003', 'FCC005', 'FCC007', 'FCC009', 'FCC011', 'FCC013', 'FCC015', 'FCC017', 'FCC019', 'FCC021', 'FCC023', 'FCC025', 'FCC027', 'FCC029', 'FCC031', 'FCC033', 'FCC035', 'FCC037', 'FCC039', 'FCC041', 'FCC043', 'FCC045', 'FCC047', 'FCC049');

-- Choir & Praise Team - 15 members
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Choir & Praise Team'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'coordinator'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 2 THEN 'secretary'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '20 days'
FROM members m 
WHERE m.member_number IN ('FCC051', 'FCC052', 'FCC053', 'FCC054', 'FCC055', 'FCC056', 'FCC057', 'FCC058', 'FCC059', 'FCC060', 'FCC061', 'FCC062', 'FCC063', 'FCC064', 'FCC065');

-- Evangelism Department - 12 members
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Evangelism Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'chairperson'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 2 THEN 'secretary'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '40 days'
FROM members m 
WHERE m.member_number IN ('FCC066', 'FCC067', 'FCC068', 'FCC069', 'FCC070', 'FCC071', 'FCC072', 'FCC073', 'FCC074', 'FCC075', 'FCC076', 'FCC077');

-- Ushering Department - 10 members
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Ushering Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'coordinator'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 2 THEN 'secretary'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '15 days'
FROM members m 
WHERE m.member_number IN ('FCC078', 'FCC079', 'FCC080', 'FCC081', 'FCC082', 'FCC083', 'FCC084', 'FCC085', 'FCC086', 'FCC087');

-- Prayer & Intercession Department - 8 members
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'coordinator'::department_position
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 2 THEN 'secretary'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '25 days'
FROM members m 
WHERE m.member_number IN ('FCC088', 'FCC089', 'FCC090', 'FCC091', 'FCC092', 'FCC093', 'FCC094', 'FCC095');

-- Media & Technical Department - 5 members
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Media & Technical Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'coordinator'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '35 days'
FROM members m 
WHERE m.member_number IN ('FCC096', 'FCC097', 'FCC098', 'FCC099', 'FCC100');

-- Some members can be in multiple departments (cross-department participation)
-- Add some members to Children's Department as teachers/helpers
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Children''s Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '50 days'
FROM members m 
WHERE m.occupation LIKE '%Teacher%' AND m.member_number IN ('FCC001', 'FCC010', 'FCC068', 'FCC100');

-- Add some members to Welfare & Counseling Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'coordinator'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '55 days'
FROM members m 
WHERE m.occupation IN ('Doctor', 'Nurse', 'Social Worker', 'Lawyer') AND m.member_number IN ('FCC005', 'FCC002', 'FCC016', 'FCC008', 'FCC070', 'FCC090');

-- Add some members to Mission & Outreach Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Mission & Outreach Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '65 days'
FROM members m 
WHERE m.member_number IN ('FCC011', 'FCC021', 'FCC035', 'FCC043', 'FCC059', 'FCC069', 'FCC079', 'FCC089', 'FCC099');

-- Add some members to Discipleship & Teaching Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Discipleship & Teaching Department'),
  m.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY m.member_number) = 1 THEN 'coordinator'::department_position
    ELSE 'member'::department_position
  END,
  m.membership_date + INTERVAL '70 days'
FROM members m 
WHERE m.occupation LIKE '%Teacher%' OR m.occupation LIKE '%Pastor%' OR m.occupation LIKE '%Doctor%' AND m.member_number IN ('FCC001', 'FCC005', 'FCC010', 'FCC068', 'FCC100');