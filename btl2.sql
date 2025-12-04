create schema btl2;
use btl2;
create table `user` (
	ID int primary key auto_increment,
    Username varchar (30) not null unique,
    Email varchar(100) not null unique check (Email regexp '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$'),
    `Password` varchar(255) not null check (length(Password) > 8),
    FName varchar (20) not null,
    LName varchar (20) not null,
    Created_date date not null,
    Address varchar (50) not null,
    Phonenumber char(10) not null check (Phonenumber regexp '^0[0-9]{9}$'),
    Profile_Picture varchar(255),
    Bdate date not null
);

create table candidate (
	ID int primary key not null,
    constraint fk_u_c_id foreign key (ID) references user (ID) 
		on delete cascade on update cascade
);

create table package (
	PackageName varchar (30) primary key,
    cost int not null default 0,
    desciption text,
    time int
); 

create table employer (
	ID int primary key not null,
    NumberOfOpenedJob int unsigned default 0,
    constraint fk_u_emp_id foreign key (ID) references user (ID) 
		on delete cascade on update cascade
);

create table purchase (
	pID int primary key auto_increment,
	EmpID int not null,
    PackageName varchar (30) not null,
    purchaseDate date not null,
    constraint fk_pack_pur_n foreign key (PackageName) references package (PackageName) 
		on delete restrict on update cascade,
	constraint fk_emp_pur_id foreign key (EmpID) references employer(ID)
		on update cascade on delete cascade
);

create table follow (
	CandidateID int not null,
    EmployerID int not null,
    primary key (CandidateID, EmployerID),
    constraint fk_emp_fl_id foreign key (EmployerID) references employer(ID)
		on delete cascade on update cascade,
    constraint fk_can_fl_id foreign key (CandidateID) references candidate(ID)
		on delete cascade on update cascade
);

create table social_media_link (
	SMLID int not null,
    UserID int not null,
    SMLlink varchar(255) not null unique check (SMLlink regexp '^http://' or SMLlink regexp '^https://'),
    primary key (SMLID, UserID),
    constraint fk_user_sml_id foreign key (UserID) references user(ID)
		on delete cascade on update cascade
);

create table feedback (
	FeedID int primary key auto_increment,
    Image varchar(500) not null,
    Topic varchar(50) not null,
    Content varchar(200), 
    UserID int not null,
    constraint fk_user_feed_id foreign key (UserID) references user(ID)
		on delete cascade on update cascade
);

create table inbox (
	MID int primary key auto_increment,
	SenderID int not null,
    ReceiverID int not null,
    SenderRole varchar(20),
    Content varchar(500),
    TimeSent datetime,
    constraint fk_user_sen_id foreign key (SenderID) references user(ID),
    constraint fk_user_re_id foreign key (ReceiverID) references user(ID)
);

create table review (
	rID int primary key auto_increment,
    `Rank` tinyint unsigned not null check (`Rank` between 1 and 5),
    Content varchar(200),
    CandidateID int,
    EmployerID int not null,
    constraint fk_emp_r_id foreign key (EmployerID) references employer(ID)
		on delete cascade on update cascade,
    constraint fk_can_r_id foreign key (CandidateID) references candidate(ID)
		on delete set null on update cascade
);

create table `profile` (
	ProfileID int primary key,
    Award varchar(500),
    savedCv varchar(255) not null,
    YearOfExperience int  not null default 0,
    CandidateID int not null,
    constraint fk_can_prf_id foreign key (CandidateID) references candidate(ID)
		on delete cascade on update cascade
);

create table Foreign_Language (
	ProfileId int not null,
    `Name` varchar(30) not null,
    `Level` varchar(20) not null,
    primary key (ProfileID, `Name`, `Level`),
    constraint fk_prf_l_id foreign key (ProfileID) references `profile`(ProfileID)
		on delete cascade on update cascade
);

create table company (
	CompanyID int primary key auto_increment,
    CNationality varchar(10),
    CName varchar(50) not null,
    Website varchar(255) not null check (Website regexp '^http://' or Website regexp '^https://'),
    Industry varchar(30) not null,
    CompanySize mediumint,
    Logo varchar(255) not null,
    `Description` varchar(200),
    TaxNumber varchar(13) not null unique check (TaxNumber regexp '^[0-9]{10}$' or TaxNumber regexp '^[0-9]{13}$'),
    EmployerID int not null,
    constraint fk_emp_c_id foreign key (EmployerID) references employer(ID)
		on delete cascade on update cascade
); 
	
create table job_history (
	HistoryID int not null,
	CompanyName varchar(50) not null,
    Starttime date not null,
    Endtime date not null,
    Position varchar(30) not null,
    ProfileID int not null,
    primary key (HistoryID, ProfileID),
    constraint ck_jh_time check (Starttime < Endtime),
    constraint fk_prf_j_id foreign key (ProfileID) references `profile`(ProfileID)
		on delete cascade on update cascade
);

create table project (
	`Name` varchar(50) not null,
    Link varchar(255) not null check (Link regexp '^http://' or Link regexp '^https://'),
    `Role` varchar(20),
    Starttime date,
    Endtime date,
    HistoryID int not null,
    ProfileID int not null,
    primary key (`Name`, HistoryID, ProfileID),
    constraint ck_prj_time check (Starttime < Endtime),
    constraint fk_his_id foreign key (HistoryID, ProfileID) references job_history(HistoryID, ProfileID)
		on delete cascade on update cascade
);

create table education (
	EduType varchar(10) not null,
    Address varchar(50) not null,
    EduName varchar(50) not null,
    primary key (EduType, Address, EduName)
);

create table study (
	ProfileID int not null,
    EduType varchar(10) not null,
    Address varchar(50) not null,
    EduName varchar(50) not null,
    Degree varchar(20),
    Major varchar(20),
    StartYear date not null,
    EndYear date,
    primary key (ProfileID, EduType, Address, EduName),
    constraint ck_std_time check (StartYear < EndYear),
    constraint fk_std_prf_id foreign key (ProfileID) references profile(ProfileID)
		on delete cascade on update cascade,
    constraint fk_std_edu foreign key (EduType, Address, EduName) references education(EduType, Address, EduName)
		on delete cascade on update cascade
);

create table skill (
	SkillName varchar(20) primary key,
    `Description` varchar(200) not null
);

create table include (
	SkillName varchar(20) not null,
    ProfileID int not null,
    primary key (SkillName, ProfileID),
    constraint fk_sk_n foreign key (SkillName) references skill(SkillName),
    constraint fk_prf_i_id foreign key (ProfileID) references `profile`(ProfileID)
		on delete cascade on update cascade
);

create table certificate (
	ProfileID int not null,
    CertID int not null,
    CertName varchar(30) not null,
    Score int not null,
    `Organization` varchar(50) not null,
    Link varchar(255) check (Link regexp '^http://' or Link regexp '^https://'),
    issueDate date not null,
    `Description` varchar(300),
    primary key (ProfileID, CertID),
    constraint fk_cert_prf_id foreign key (ProfileID) references `profile`(ProfileID)
		on delete cascade on update cascade
);

create table job (
	JobID int primary key auto_increment,
    JobName varchar(20) not null,
    JD varchar(500) not null,
    JobType varchar(20) not null,
    ContractType varchar(20) not null,
    `Level` varchar(20) not null,
    Quantity int unsigned not null check (Quantity >= 1),
    SalaryFrom int not null,
    SalaryTo int not null,
    RequiredExpYear int not null,
    Location varchar(30) not null,
    PostDate date not null,
    ExpireDate date not null,
    JobStatus varchar(10) not null,
    NumberOfApplicant int unsigned default 0,
    EmployerID int not null,
    constraint ck_j_time check (ExpireDate > PostDate),
    constraint ck_j_sl check (SalaryFrom > 0 and SalaryTo > SalaryFrom),
    constraint fk_emp_j_id foreign key (EmployerID) references employer(ID)
		on delete cascade on update cascade
);

create table `require` (
	JobID int not null,
    SkillName varchar(20) not null,
    primary key (JobID, SkillName),
    constraint fk_j_r_id foreign key (JobID) references job(JobID)
		on delete cascade on update cascade,
    constraint fk_sk_r_n foreign key (SkillName) references skill(SkillName)
);

create table job_category (
	JCName varchar(20) primary key,
    Specialty varchar(200) not null
);

create table related (
	JCName1 varchar(20) not null,
    JCName2 varchar(20) not null,
    primary key (JCName1, JCName2),
    constraint fk_relate_1 foreign key(JCName1) references job_category(JCName)
		on delete cascade on update cascade,
    constraint fk_relate_2 foreign key(JCName2) references job_category(JCName)
		on delete cascade on update cascade
);

create table `in` (
	JobID int not null,
    JCName varchar(20) not null,
    primary key (JobID, JCName),
    constraint fk_in_job foreign key (JobID) references job(JobID)
		on delete cascade on update cascade,
    constraint fk_in_jc foreign key (JCName) references job_category(JCName)
		on delete cascade on update cascade
);

create table notification (
	nID int primary key auto_increment,
    Title varchar(30) not null,
    Content varchar(200) not null,
    `Time` datetime not null,
    CandidateID int not null,
    EmployerID int not null,
    JobID int not null,
    constraint fk_can_noti foreign key (CandidateID) references candidate(ID),
    constraint fk_emp_noti foreign key (EmployerID) references employer(ID),
    constraint fk_j_noti foreign key (JobID) references job(JobID)
);

create table favourite (
	CandidateID int not null,
    JobID int not null,
    `Date` date not null,
    primary key (CandidateID, JobID),
    constraint fk_can_fv foreign key (CandidateID) references candidate(ID)
		on delete cascade on update cascade,
    constraint fk_j_fv foreign key (JobID) references job(JobID)
		 on delete cascade on update cascade
);

create table apply (
	CandidateID int not null,
    JobID int not null,
    upLoadCV varchar(50) not null default ' ',
    CoverLetter varchar(50),
    Status_apply varchar(20) not null default 'Đang duyệt',
    primary key (CandidateID, JobID),
    constraint fk_can_a foreign key (CandidateID) references candidate(ID)
		on delete cascade on update cascade,
    constraint fk_j_a foreign key (JobID) references job(JobID)
		on delete cascade on update cascade
);

create table personal_project (
	`Name` varchar(50) not null,
    Link varchar(255) not null check (Link regexp '^http://' or Link regexp '^https://'),
    `Role` varchar(20),
    Starttime date,
    Endtime date,
    ProfileID int not null,
    primary key (`Name`, ProfileID),
    constraint ck_per_time check (Starttime < Endtime),
    constraint fk_per_prf_id foreign key (ProfileID) references profile(ProfileID)
		on delete cascade on update cascade
);

use btl2;
DELIMITER $$
create trigger RB1 before insert on `user`
for each row
begin 
	if timestampdiff(year, new.Bdate, curdate()) < 18 then signal sqlstate '45000' set message_text = 'Nguoi dung nho hon 18 tuoi';
    end if;
end $$

create trigger RB2 before insert on apply
for each row
begin
	declare cvPath varchar(255);
	if new.upLoadCV is null or new.upLoadCV = ' ' then
		select savedCV into cvPath
        from `profile`
        where CandidateID = new.CandidateID;
        set new.upLoadCV = cvPath;
    end if;
end $$

create trigger RB6 before insert on apply
for each row
begin
	declare stt varchar(10);
    declare expireday date;
    
    select JobStatus, ExpireDate into stt, expireday
    from job
    where JobID = new.JobID;
    if stt = 'Close' then signal sqlstate '45000' set message_text = 'Khong the ung tuyen vi job da dong';
    end if;
 
    if curdate() > expireday then signal sqlstate '45000' set message_text = 'Khong the ung tuyen vi job da het han';
    end if;
end $$

create trigger RB7 before insert on apply
for each row
begin
	declare prf_id int;
    declare missing int default 0;
    
    select ProfileID into prf_id
    from `profile`
    where CandidateID = new.CandidateID
    limit 1;
    
    select count(*) into missing
    from `require` r
    where r.JobID = new.JobID and 
		not exists (
			select 1 from include i 
            where i.SkillName = r.SkillName and i.ProfileID = prf_id);
	
    if missing > 0  then signal sqlstate '45000' set message_text = 'Ung cu vien khong du dieu kien de ung tuyen';
    end if;
end $$

create trigger RB11 before insert on review
for each row
begin
	declare rvcname varchar(50);
    declare counthiscname int;
    
    select CName into rvcname
    from company
    where EmployerID = new.EmployerID;
    
    select count(jh.HistoryID) into counthiscname
    from job_history jh join profile p on jh.ProfileID = p.ProfileID
    where p.CandidateID = new.CandidateID and jh.CompanyName = rvcname;
   
	if counthiscname = 0 then signal sqlstate '45000' set message_text = 'Khong du dieu kien de danh gia';
    end if;
end $$

create trigger RB14 before insert on inbox
for each row
begin
	declare checksendertype int;
    
    select count(ID) into checksendertype
    from employer 
    where ID = new.SenderID;

    if checksendertype = 0 then
		if not exists (select 1 from inbox 
			where SenderID = new.ReceiverID
              AND ReceiverID = new.SenderID
              AND SenderRole = 'employer')
		then signal sqlstate '45000' set message_text = 'Ung cu vien khong the gui tin nhan truoc';
        else set new.SenderRole = 'candidate';
        end if;
	else set new.SenderRole = 'employer';
    end if;
end $$

create trigger RB13b before insert on inbox
for each row
begin
	declare purchaseday date;
    declare timegold int;
    
    select max(purchaseDate) into purchaseday
    from purchase
    where PackageName = 'Gold' and (EmpID = new.SenderID or EmpID = new.ReceiverID);
    
    select time into timegold
    from package
    where PackageName = 'Gold';
        
    if purchaseday is null then signal sqlstate '45000' set message_text = 'Khong du dieu kien de thuc hien gui tin nhan';
    end if;
	if curdate() > purchaseday + interval timegold day then signal sqlstate '45000' set message_text = 'Khong du dieu kien de thuc hien gui tin nhan';
	end if;
	
end $$ 

create trigger RB13a before insert on job
for each row
begin
	declare purchaseday date;
    declare timepackage int;
    declare pname varchar(30);
    
    select purchaseDate, PackageName into purchaseday, pname
    from purchase
    where EmpID = new.EmployerID
    order by purchaseDate desc limit 1;
    
    if purchaseday is null or pname is null then signal sqlstate '45000' set message_text = 'Khong du dieu kien de thuc hien dang bai';
    end if;
    
    select time into timepackage
    from package
    where PackageName = pname;
    
    if curdate() > purchaseday + interval timepackage day then signal sqlstate '45000' set message_text = 'Khong du dieu kien de thuc hien dang bai';
	end if;
end $$


create trigger RB4 before insert on apply
for each row
begin
	declare check_per int;
    declare check_jh int;
    declare check_cer int;
    declare check_std int;
    declare check_fl int;
    declare check_inc int;
    declare prfid int;
    
    select ProfileID into prfid
    from profile
    where CandidateID = new.CandidateID;
    
    select count(ProfileID) into check_jh
    from job_history
    where ProfileID = prfid;
    
    select count(ProfileID) into check_per
    from personal_project
    where ProfileID = prfid;
    
    select count(ProfileID) into check_cer
    from certificate
    where ProfileID = prfid;
    
    select count(ProfileID) into check_fl
    from foreign_language
    where ProfileID = prfid;
    
    select count(ProfileID) into check_std
    from study
    where ProfileID = prfid;
    
    select count(ProfileID) into check_inc
    from include
    where ProfileID = prfid;
    
    if (check_jh = 0 and check_per = 0) or check_cer = 0  or check_std = 0 or check_fl = 0 or check_inc = 0
		then signal sqlstate '45000' set message_text = 'Ung cu vien chua hoan thanh ly lich';
	end if;
end $$

create trigger package_trial before insert on purchase
for each row
begin
	if new.PackageName = 'Trial' then
		if exists(
			select 1
			from purchase
			where EmpID = new.EmpID and PackageName = 'Trial') then  signal sqlstate '45000' set message_text = 'Da het luot dung thu';
		end if;
	end if;
end $$

create trigger notify_apply_job before insert on notification
for each row
begin
	if not exists (select 1 from job where JobID = new.JobID and EmployerID = new.EmployerID) then
		signal sqlstate '45000' set message_text = 'JobID khong thuoc ve EmployerID';
	end if;
    
    if not exists (select 1 from apply where CandidateID = new.CandidateID and JobID = new.JobID) then
		signal sqlstate '45000' set message_text = 'Candidate chua apply vao JobID nay';
	end if;
end $$

create trigger status_aplly_notification after insert on notification
for each row
begin
	if new.Title = 'Hồ sơ phù hợp' then 
    update apply
    set Status_apply = 'Đã duyệt'
    where CandidateID = new.CandidateID and JobID = new.JobID;
    end if;
    
    if new.Title = 'Hồ sơ không phù hợp' then 
    update apply
    set Status_apply = 'Từ chối'
    where CandidateID = new.CandidateID and JobID = new.JobID;
    end if;
end $$ 

create trigger increase_opened_job after insert on job
for each row
begin
    update employer
    set NumberOfOpenedJob = NumberOfOpenedJob + 1
    where ID = NEW.EmployerID;
end $$

create trigger increase_year_of_experience after insert on job_history
for each row
begin
    update profile
    set YearOfExperience = YearOfExperience + TIMESTAMPDIFF(YEAR, NEW.Starttime, NEW.Endtime)
    where ProfileID = NEW.ProfileID;
end $$

CREATE TRIGGER increase_applicant AFTER INSERT ON apply
FOR EACH ROW
BEGIN
	UPDATE job
    SET NumberOfApplicant = NumberOfApplicant + 1
    WHERE JobID = NEW.JobID;
END $$


CREATE TRIGGER decrease_applicant AFTER DELETE ON apply
FOR EACH ROW
BEGIN
    UPDATE job
    SET NumberOfApplicant = NumberOfApplicant - 1
    WHERE JobID = OLD.JobID;
END $$


CREATE TRIGGER update_applicant_count AFTER UPDATE ON apply
FOR EACH ROW
BEGIN
    IF OLD.JobID != NEW.JobID THEN
        UPDATE job
        SET NumberOfApplicant = NumberOfApplicant - 1
        WHERE JobID = OLD.JobID;

        UPDATE job
        SET NumberOfApplicant = NumberOfApplicant + 1
        WHERE JobID = NEW.JobID;
    END IF;
END $$



