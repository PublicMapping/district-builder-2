import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { IProject } from "../../../../shared/entities";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { User } from "../../users/entities/user.entity";

@Entity()
export class Project implements IProject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ name: "number_of_districts" })
  numberOfDistricts: number;

  @ManyToOne(() => RegionConfig)
  @JoinColumn({ name: "region_config_id" })
  regionConfig: RegionConfig;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "timestamp with time zone", name: "created_dt", default: () => "NOW()" })
  createdDt: Date;
}